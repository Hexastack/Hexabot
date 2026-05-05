/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Workflow as AgenticWorkflow,
  ExecutionState,
  JsonataFunctionRegistry,
  StepExecutionRecord,
  WorkflowRunner,
} from '@hexabot-ai/agentic';
import { WorkflowRunFull, WorkflowFull } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';

import { ActionService } from '@/actions/actions.service';
import { RuntimeBindingsService } from '@/bindings/runtime-bindings.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';

import { WorkflowContextFactory } from '../contexts/workflow-context-factory';
import { WorkflowRuntimeContext } from '../contexts/workflow-runtime.context';
import { TriggerEventWrapper } from '../lib/trigger-event-wrapper';
import { parseWorkflowDefinition } from '../lib/workflow-definition';
import { RunStrategy, RunWorkflowOptions, WorkflowResult } from '../types';

import { WorkflowRunService } from './workflow-run.service';
import { WorkflowService } from './workflow.service';

@Injectable()
export class AgenticService {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly actionService: ActionService,
    private readonly runtimeBindingsService: RuntimeBindingsService,
    private readonly logger: LoggerService,
    private readonly workflowContextFactory: WorkflowContextFactory,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Process an event by resuming a suspended workflow run if it exists,
   * otherwise start a new run using the latest configured workflow (or the default fallback).
   */
  async handleEvent(
    event: TriggerEventWrapper,
  ): Promise<WorkflowRunFull | null> {
    const initiator = event.getInitiator();
    const requestedWorkflowId = event.getWorkflowId();
    const threadId = event.getThreadId();
    this.logger.debug('Handling incoming workflow event');
    if (!initiator) {
      this.logger.warn(
        'Skipping workflow execution due to missing event initiator',
      );

      return null;
    }

    try {
      const suspendedRun =
        await this.workflowRunService.findSuspendedRunByInitiator(
          initiator.id,
          threadId,
          requestedWorkflowId,
        );
      if (suspendedRun) {
        this.logger.log('Resuming suspended workflow run', {
          triggeredById: initiator.id,
          runId: suspendedRun.id,
          workflowId: suspendedRun.workflow?.id,
          suspendedStep: suspendedRun.suspendedStep,
          suspensionReason: suspendedRun.suspensionReason,
        });

        return await this.runWorkflow({
          mode: 'resume',
          run: suspendedRun,
          event,
        });
      }

      const workflowToRun = requestedWorkflowId
        ? await this.workflowService.findOneAndPopulate(requestedWorkflowId)
        : await this.workflowService.pickWorkflow();
      if (!workflowToRun) {
        this.logger.warn('No workflow available to handle incoming event', {
          requestedWorkflowId: requestedWorkflowId ?? null,
        });

        return null;
      }
      if (!workflowToRun.definition) {
        this.logger.warn('Workflow definition is missing', {
          workflowId: workflowToRun.id,
        });

        return null;
      }

      this.logger.log('Starting workflow run', {
        workflowId: workflowToRun.id,
      });

      return await this.runWorkflow({
        mode: 'start',
        workflow: workflowToRun,
        event,
      });
    } catch (err) {
      this.logger.error(
        'Unable to process incoming event through agentic workflow',
        err,
      );

      return null;
    }
  }

  /**
   * Shared runner lifecycle for starting or resuming a workflow.
   */
  private async runWorkflow(
    options: RunWorkflowOptions,
  ): Promise<WorkflowRunFull> {
    const { event, mode } = options;
    const run =
      mode === 'start'
        ? await this.createRun(options.workflow, event)
        : options.run;
    const workflow = await this.workflowService.findOneAndPopulate(
      run.workflow.id,
    );
    const definition = this.resolveRunDefinition(run, workflow);
    if (!definition) {
      throw new Error('Workflow definition is required to run the workflow');
    }
    const workflowInstance = AgenticWorkflow.fromDefinition(definition, {
      actions: this.actionService.getRegistry(),
      bindingKinds: this.runtimeBindingsService.getRegistry(),
      jsonataFunctions: this.buildJsonataFunctions(event),
    });
    const context = await this.workflowContextFactory.create(
      run,
      event,
      definition,
    );

    this.logger.debug('Preparing workflow runner', {
      mode,
      runId: run.id,
      workflowId: workflow?.id,
      triggeredById: run.triggeredBy?.id,
    });

    const strategy = await this.createRunStrategy(
      mode,
      run,
      context,
      workflowInstance,
    );

    this.logger.debug('Marking workflow run as running', {
      mode,
      runId: run.id,
      workflowId: run.workflow?.id,
      triggeredById: run.triggeredBy?.id,
      hasSnapshot: Boolean(strategy.markRunningInput.snapshot ?? run.snapshot),
      hasResumeData: Boolean(
        strategy.markRunningInput.lastResumeData ?? strategy.resumeData,
      ),
    });
    await this.workflowRunService.markRunning(run.id, {
      ...strategy.markRunningInput,
      context: context.state,
    });

    let result: WorkflowResult;
    try {
      this.logger.debug('Executing workflow runner', {
        mode,
        runId: run.id,
        workflowId: run.workflow?.id,
        triggeredById: run.triggeredBy?.id,
      });
      result = await strategy.execute();
    } catch (err) {
      this.logger.error('Workflow runner threw during execution', err);
      await this.markRunFailed(run, strategy.runner, context.state, err);

      throw err;
    }

    this.logger.debug('Workflow runner completed', {
      mode,
      runId: run.id,
      workflowId: run.workflow?.id,
      triggeredById: run.triggeredBy?.id,
      status: result.status,
    });
    await this.persistResult(
      run,
      strategy.runner,
      result,
      strategy.resumeData,
      context,
    );

    return (await this.workflowRunService.findOneAndPopulate(run.id)) ?? run;
  }

  /**
   * Build JSONata helpers scoped to the workflow initiator language.
   */
  private buildJsonataFunctions(
    event: TriggerEventWrapper,
  ): JsonataFunctionRegistry {
    const initiatorLanguage = event.getInitiator()?.language || undefined;

    return {
      t: (key: string, args?: Record<string, unknown>) =>
        this.i18n.t(key, {
          lang: initiatorLanguage,
          defaultValue: key,
          args,
        }),
    };
  }

  /**
   * Build the execution strategy for starting a new workflow or resuming an existing one.
   */
  private async createRunStrategy(
    mode: 'start' | 'resume',
    run: WorkflowRunFull,
    context: WorkflowRuntimeContext,
    workflowInstance: AgenticWorkflow,
  ): Promise<RunStrategy> {
    if (mode === 'start') {
      const runner = await workflowInstance.buildAsyncRunner({
        runId: run.id,
      });

      return {
        runner,
        markRunningInput: {
          snapshot: run.snapshot ?? null,
        },
        execute: () =>
          runner.start({
            inputData: run.input ?? {},
            context,
          }),
      };
    }

    const latestInput = context.event.buildInput();
    const runner = await workflowInstance.buildRunnerFromState({
      state: this.buildExecutionState(run),
      context,
      snapshot: run.snapshot ?? { status: run.status, actions: {} },
      suspension: run.suspendedStep
        ? {
            stepId: run.suspendedStep,
            reason: run.suspensionReason,
            data: run.suspensionData ?? undefined,
            stepExecId: run.suspensionStepExecId ?? undefined,
            suspendIndex: run.suspensionIndex ?? undefined,
            suspendKey: run.suspensionKey ?? undefined,
            awaitResults: run.suspensionAwaitResults ?? undefined,
          }
        : undefined,
      runId: run.id,
      lastResumeData: latestInput,
    });

    return {
      runner,
      resumeData: latestInput,
      markRunningInput: {
        lastResumeData: latestInput,
        snapshot: run.snapshot ?? null,
      },
      execute: () => runner.resume({ resumeData: latestInput }),
    };
  }

  /**
   * Create a workflow run record and load it with relations.
   */
  private async createRun(
    workflow: WorkflowFull,
    event: TriggerEventWrapper,
  ): Promise<WorkflowRunFull> {
    const initiator = event.getInitiator();
    if (!workflow.definition) {
      throw new Error('Workflow definition is required to create a run');
    }
    const initialContext = {
      ...(workflow.definition.context ?? {}),
      ...event.getContextData(),
    };
    const run = await this.workflowRunService.create({
      workflow: workflow.id,
      workflowVersion: workflow.currentVersion?.id ?? null,
      triggeredBy: initiator.id,
      thread: event.getThreadId() ?? null,
      input: event.buildInput(),
      context: Object.keys(initialContext).length > 0 ? initialContext : null,
      metadata: event.getMetadata(),
    });
    const populated = await this.workflowRunService.findOneAndPopulate(run.id);

    if (!populated) {
      throw new Error(`Unable to load workflow run ${run.id}`);
    }

    return populated;
  }

  /**
   * Resolve the workflow definition used by the current run.
   */
  private resolveRunDefinition(
    run: WorkflowRunFull,
    workflow?: WorkflowFull | null,
  ) {
    const definitionYml = run.workflowVersion?.definitionYml;
    if (typeof definitionYml === 'string' && definitionYml.trim() !== '') {
      return parseWorkflowDefinition(definitionYml);
    }

    return workflow?.definition;
  }

  /**
   * Persist workflow outcome and updated execution state.
   */
  private async persistResult(
    run: WorkflowRunFull,
    runner: WorkflowRunner,
    result: WorkflowResult,
    resumeData?: unknown,
    runtimeContext?: WorkflowRuntimeContext,
  ): Promise<void> {
    const contextState = runtimeContext?.state;
    const state = runner.getState();
    const metadata = this.buildMetadata(state, run.metadata);
    const output = this.pickOutput(result, state, run.output);
    const stepLog = this.buildStepLog(runner, run.stepLog);
    this.logger.debug('Persisting workflow result', {
      runId: run.id,
      status: result.status,
    });

    switch (result.status) {
      case 'suspended':
        this.logger.log('Workflow run suspended', {
          runId: run.id,
          stepId: result.step.id,
          reason: result.reason,
          stepExecId: result.stepExecId,
          suspendIndex: result.suspendIndex,
          suspendKey: result.suspendKey,
        });
        await this.workflowRunService.markSuspended(run.id, {
          stepId: result.step.id,
          reason: result.reason,
          data: result.data,
          stepExecId: result.stepExecId,
          suspendIndex: result.suspendIndex,
          suspendKey: result.suspendKey,
          awaitResults: result.awaitResults,
          snapshot: result.snapshot,
          context: contextState,
          lastResumeData: resumeData,
        });
        break;
      case 'finished':
        this.logger.log('Workflow run finished', {
          runId: run.id,
        });
        await this.workflowRunService.markFinished(run.id, {
          snapshot: result.snapshot,
          context: contextState,
          output: result.output ?? output,
        });
        break;
      case 'failed':
      default:
        this.logger.error('Workflow runner reported failure status', {
          runId: run.id,
          error: this.stringifyError(result.error),
        });
        await this.workflowRunService.markFailed(run.id, {
          snapshot: result.snapshot,
          context: contextState,
          error: this.stringifyError(result.error),
        });
        break;
    }

    await this.workflowRunService.updateOne(run.id, {
      input: state?.input ?? run.input ?? {},
      output,
      metadata,
      context: contextState,
      stepLog,
    });
  }

  /**
   * Build the ExecutionState used to rebuild a runner.
   */
  private buildExecutionState(run: WorkflowRunFull): ExecutionState {
    const state: ExecutionState = {
      input: run.input ?? {},
      output: run.output ?? {},
      iterationStack: [],
    };
    const storedState = (run.metadata as any)?.state;
    if (storedState) {
      if (storedState.iteration !== undefined) {
        state.iteration = storedState.iteration;
      }
      if (storedState.accumulator !== undefined) {
        state.accumulator = storedState.accumulator;
      }
      state.iterationStack = storedState.iterationStack ?? [];
    }

    return state;
  }

  /**
   * Build the metadata payload for persisting workflow run state.
   */
  private buildMetadata(
    state: ExecutionState | undefined,
    existing?: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    const next = { ...(existing ?? {}) };
    if (state) {
      next.state = {
        iteration: state.iteration,
        accumulator: state.accumulator,
        iterationStack: state.iterationStack,
      };
    }

    return Object.keys(next).length > 0 ? next : null;
  }

  /**
   * Merge persisted step log entries with the latest runner log.
   */
  private buildStepLog(
    runner: WorkflowRunner,
    existing?: Record<string, StepExecutionRecord> | null,
  ): Record<string, StepExecutionRecord> | null {
    const merged = { ...(existing ?? {}), ...runner.getStepLog() };

    return Object.keys(merged).length > 0 ? merged : null;
  }

  /**
   * Decide which output payload to persist based on result and runner state.
   */
  private pickOutput(
    result: WorkflowResult,
    state: ExecutionState | undefined,
    fallback?: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (result.status === 'finished' && result.output) {
      return result.output;
    }

    if (state?.output) {
      return state.output;
    }

    return fallback ?? null;
  }

  /**
   * Persist a failing workflow run when runner execution throws.
   */
  private async markRunFailed(
    run: WorkflowRunFull,
    runner: WorkflowRunner,
    contextState: Record<string, unknown> | null,
    error: unknown,
  ): Promise<void> {
    const state = runner.getState();
    const metadata = this.buildMetadata(state, run.metadata);
    const stepLog = this.buildStepLog(runner, run.stepLog);

    this.logger.error(
      'Persisting failed workflow run after runner crash',
      error,
      {
        runId: run.id,
        workflowId: run.workflow?.id,
        triggeredById: run.triggeredBy?.id ?? null,
      },
    );
    await this.workflowRunService.markFailed(run.id, {
      snapshot: runner.getSnapshot(),
      context: contextState,
      error: this.stringifyError(error),
    });

    await this.workflowRunService.updateOne(run.id, {
      input: state?.input ?? run.input ?? {},
      output: state?.output ?? run.output ?? null,
      metadata,
      context: contextState,
      stepLog,
    });
  }

  /**
   * Convert an unknown error into a readable string.
   */
  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    return typeof error === 'string' ? error : JSON.stringify(error);
  }
}
