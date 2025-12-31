/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Workflow as AgentWorkflow,
  ExecutionState,
  WorkflowRunner,
} from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';

import { ActionService } from '@/actions/actions.service';
import ConversationalEventWrapper from '@/channel/lib/ConversationalEventWrapper';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { LoggerService } from '@/logger/logger.service';
import { WorkflowRunFull } from '@/workflow/dto/workflow-run.dto';
import { Workflow as WorkflowDto } from '@/workflow/dto/workflow.dto';
import {
  ManualEventWrapper,
  ScheduledEventWrapper,
  TriggerEventWrapper,
} from '@/workflow/lib/trigger-event-wrapper';

import {
  RunStrategy,
  RunWorkflowOptions,
  StartWorkflowOptions,
  WorkflowResult,
  WorkflowType,
} from '../types';

import { WorkflowRuntimeContext } from './base-workflow-context';
import { ConversationalWorkflowContext } from './conversational-workflow-context';
import { ManualWorkflowContext } from './manual-workflow-context';
import { ScheduledWorkflowContext } from './scheduled-workflow-context';
import { WorkflowRunService } from './workflow-run.service';
import { WorkflowService } from './workflow.service';

@Injectable()
export class AgenticService {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly actionService: ActionService,
    private readonly logger: LoggerService,
    private readonly conversationalWorkflowContext: ConversationalWorkflowContext,
    private readonly manualWorkflowContext: ManualWorkflowContext,
    private readonly scheduledWorkflowContext: ScheduledWorkflowContext,
  ) {}

  /**
   * Process an incoming channel event by resuming a suspended workflow run if it exists,
   * otherwise start a new run using the latest configured workflow (or the default fallback).
   */
  async handleMessageEvent(
    event: ConversationalEventWrapper<any, any>,
  ): Promise<void> {
    const subscriber = event.getSender();
    const eventContext = {
      subscriberId: subscriber?.id,
      messageId: this.safeInvoke(() => event.getId()),
      eventType: this.safeInvoke(() => event.getEventType()),
      messageType: this.safeInvoke(() => event.getMessageType()),
    };
    this.logger.debug('Handling incoming workflow event', eventContext);

    try {
      const suspendedRun =
        await this.workflowRunService.findSuspendedRunBySubscriber(
          subscriber.id,
        );
      if (suspendedRun) {
        this.logger.log('Resuming suspended workflow run', {
          ...eventContext,
          runId: suspendedRun.id,
          workflowId: suspendedRun.workflow?.id,
          suspendedStep: suspendedRun.suspendedStep,
          suspensionReason: suspendedRun.suspensionReason,
        });
        await this.runWorkflow({ mode: 'resume', run: suspendedRun, event });

        return;
      }

      const workflow = await this.workflowService.pickWorkflow();
      if (!workflow) {
        this.logger.warn('No workflow available to handle incoming event');

        return;
      }

      this.logger.log('Starting workflow run from latest definition', {
        ...eventContext,
        workflowId: workflow.id,
      });
      await this.runWorkflow({
        mode: 'start',
        workflow,
        event,
      });
    } catch (err) {
      this.logger.error(
        'Unable to process incoming event through agentic workflow',
        err,
      );
    }
  }

  /**
   * Start a workflow for non-conversational triggers (scheduled or manual).
   */
  async startWorkflow(
    workflow: WorkflowDto,
    options: StartWorkflowOptions,
  ): Promise<WorkflowRunFull | null> {
    if (workflow.type !== options.trigger) {
      this.logger.warn('Workflow trigger type mismatch', {
        workflowId: workflow.id,
        workflowType: workflow.type,
        trigger: options.trigger,
      });
    }

    const event = this.buildTriggerEvent(workflow, options);
    if (!event) {
      return null;
    }

    try {
      return await this.runWorkflow({
        mode: 'start',
        workflow,
        event,
      });
    } catch (err) {
      this.logger.error('Unable to start workflow', err, {
        workflowId: workflow.id,
        trigger: workflow.type,
      });

      return null;
    }
  }

  /**
   * Shared runner lifecycle for starting or resuming a workflow.
   */
  private async runWorkflow(
    options: RunWorkflowOptions<TriggerEventWrapper>,
  ): Promise<WorkflowRunFull> {
    const { event } = options;
    const run =
      options.mode === 'start'
        ? await this.createRun(options.workflow, event)
        : options.run;
    const logContext = this.buildRunLogContext(run, options.mode, event);
    const workflowInstance = AgentWorkflow.fromDefinition(
      run.workflow.definition,
      this.buildActionsRegistry(),
    );
    const context = this.buildContext(run.workflow.type, run, event);
    const contextState = this.getContextState(context);
    this.logger.debug('Preparing workflow runner', {
      ...logContext,
      hasContextState: Boolean(contextState),
    });
    const strategy = await this.createRunStrategy(
      options.mode,
      run,
      context,
      workflowInstance,
      event,
    );

    this.logger.debug('Marking workflow run as running', {
      ...logContext,
      hasSnapshot: Boolean(strategy.markRunningInput.snapshot ?? run.snapshot),
      hasMemory: Boolean(strategy.markRunningInput.memory ?? run.memory),
      hasResumeData: Boolean(
        strategy.markRunningInput.lastResumeData ?? strategy.resumeData,
      ),
    });
    await this.workflowRunService.markRunning(run.id, {
      ...strategy.markRunningInput,
      context: contextState,
    });

    let result: WorkflowResult;
    try {
      this.logger.debug('Executing workflow runner', logContext);
      result = await strategy.execute();
    } catch (err) {
      this.logger.error(
        'Workflow runner threw during execution',
        err,
        logContext,
      );
      await this.markRunFailed(run, strategy.runner, contextState, err);

      throw err;
    }

    this.logger.debug('Workflow runner completed', {
      ...logContext,
      status: result.status,
    });
    await this.persistResult(
      run,
      strategy.runner,
      result,
      strategy.resumeData,
      context,
      logContext,
    );

    return run;
  }

  private buildContext(
    workflowType: WorkflowType,
    run: WorkflowRunFull,
    event: TriggerEventWrapper,
  ): WorkflowRuntimeContext {
    switch (workflowType) {
      case WorkflowType.manual:
        return this.manualWorkflowContext.buildFromRun(
          run,
          event as ManualEventWrapper,
        );
      case WorkflowType.scheduled:
        return this.scheduledWorkflowContext.buildFromRun(
          run,
          event as ScheduledEventWrapper,
        );
      case WorkflowType.conversational:
      default:
        return this.conversationalWorkflowContext.buildFromRun(
          run,
          event as ConversationalEventWrapper<any, any>,
        );
    }
  }

  private buildTriggerEvent(
    workflow: WorkflowDto,
    options: StartWorkflowOptions,
  ): TriggerEventWrapper | null {
    switch (workflow.type) {
      case WorkflowType.scheduled:
        return new ScheduledEventWrapper({
          schedule: workflow.schedule ?? undefined,
          triggeredAt: options.triggeredAt ?? new Date(),
          input: options.input,
        });
      case WorkflowType.manual:
        return new ManualEventWrapper(
          options.input ?? {},
          options.subscriber?.id,
        );
      case WorkflowType.conversational:
      default:
        this.logger.warn(
          'startWorkflow is intended for non-conversational workflows',
          {
            workflowId: workflow.id,
            workflowType: workflow.type,
          },
        );

        return null;
    }
  }

  /**
   * Build the execution strategy for starting a new workflow or resuming an existing one.
   */
  private async createRunStrategy(
    mode: 'start' | 'resume',
    run: WorkflowRunFull,
    context: WorkflowRuntimeContext,
    workflowInstance: AgentWorkflow,
    event: TriggerEventWrapper,
  ): Promise<RunStrategy> {
    if (mode === 'start') {
      const runner = await workflowInstance.buildAsyncRunner({
        runId: run.id,
      });
      const memory = run.memory ?? run.workflow.definition.memory ?? {};

      return {
        runner,
        markRunningInput: {
          snapshot: run.snapshot ?? null,
          memory,
        },
        execute: () =>
          runner.start({
            inputData: run.input ?? {},
            context,
            memory,
          }),
      };
    }

    const latestInput = this.buildInput(event);
    const resumeData = this.buildResumeData(event);
    const runner = await workflowInstance.buildRunnerFromState({
      state: this.buildExecutionState(run, latestInput),
      context,
      snapshot: run.snapshot ?? { status: run.status, actions: {} },
      suspension: run.suspendedStep
        ? {
            stepId: run.suspendedStep,
            reason: run.suspensionReason,
            data: run.suspensionData ?? undefined,
          }
        : undefined,
      runId: run.id,
      lastResumeData: resumeData,
    });

    return {
      runner,
      resumeData,
      markRunningInput: {
        lastResumeData: resumeData,
        snapshot: run.snapshot ?? null,
        memory: run.memory ?? null,
      },
      execute: () => runner.resume({ resumeData }),
    };
  }

  /**
   * Create a workflow run record and load it with relations.
   */
  private async createRun(
    workflow: WorkflowDto,
    event: TriggerEventWrapper,
  ): Promise<WorkflowRunFull> {
    const subscriber = this.safeInvoke(() => event.getSender() as Subscriber);
    const run = await this.workflowRunService.create({
      workflow: workflow.id,
      triggeredBy: subscriber?.id ?? null,
      input: this.buildInput(event),
      memory: workflow.definition.memory ?? null,
      context: workflow.definition.context ?? null,
      metadata: event.getMetadata(),
    });
    const populated = await this.workflowRunService.findOneAndPopulate(run.id);

    if (!populated) {
      throw new Error(`Unable to load workflow run ${run.id}`);
    }

    return populated;
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
    logContext?: Record<string, unknown>,
  ): Promise<void> {
    const contextState = this.getContextState(runtimeContext);
    const state = this.getRunnerState(runner);
    const metadata = this.buildMetadata(state, run.metadata);
    const output = this.pickOutput(result, state, run.output);
    this.logger.debug('Persisting workflow result', {
      ...(logContext ?? {}),
      status: result.status,
    });

    switch (result.status) {
      case 'suspended':
        this.logger.log('Workflow run suspended', {
          ...(logContext ?? {}),
          stepId: result.step.id,
          reason: result.reason,
        });
        await this.workflowRunService.markSuspended(run.id, {
          stepId: result.step.id,
          reason: result.reason,
          data: result.data,
          snapshot: result.snapshot,
          memory: state?.memory ?? null,
          context: contextState,
          lastResumeData: resumeData,
        });
        break;
      case 'finished':
        this.logger.log('Workflow run finished', logContext);
        await this.workflowRunService.markFinished(run.id, {
          snapshot: result.snapshot,
          memory: state?.memory ?? null,
          context: contextState,
          output: result.output ?? output,
        });
        break;
      case 'failed':
      default:
        this.logger.error('Workflow runner reported failure status', {
          ...(logContext ?? {}),
          error: this.stringifyError(result.error),
        });
        await this.workflowRunService.markFailed(run.id, {
          snapshot: result.snapshot,
          memory: state?.memory ?? null,
          context: contextState,
          error: this.stringifyError(result.error),
        });
        break;
    }

    await this.workflowRunService.updateOne(run.id, {
      input: state?.input ?? run.input ?? {},
      output,
      memory: state?.memory ?? run.memory ?? null,
      metadata,
      context: contextState,
    });
  }

  /**
   * Build the ExecutionState used to rebuild a runner.
   */
  private buildExecutionState(
    run: WorkflowRunFull,
    latestInput?: Record<string, unknown>,
  ): ExecutionState {
    const baseInput = run.input ?? {};
    const mergedInput =
      latestInput && Object.keys(latestInput).length > 0
        ? { ...baseInput, ...latestInput }
        : baseInput;
    const state: ExecutionState = {
      input: mergedInput,
      memory: run.memory ?? {},
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
   * Build the workflow input payload from the incoming event.
   */
  private buildInput(event: TriggerEventWrapper): Record<string, unknown> {
    const input = this.safeInvoke(() => event.toWorkflowInput());

    return input ?? {};
  }

  /**
   * Extract the resume payload expected by messaging actions.
   */
  private buildResumeData(
    event: TriggerEventWrapper,
  ): Record<string, unknown> | undefined {
    return this.safeInvoke(() => event.getResumeData());
  }

  /**
   * Build a mapping of registered actions keyed by their names.
   */
  private buildActionsRegistry(): Record<
    string,
    ReturnType<ActionService['getAll']>[number]
  > {
    return Object.fromEntries(
      this.actionService.getAll().map((action) => [action.getName(), action]),
    );
  }

  /**
   * Safely invoke a function and swallow any errors, returning undefined on failure.
   */
  private safeInvoke<T>(fn: () => T): T | undefined {
    try {
      const value = fn();

      return value === undefined ? undefined : value;
    } catch {
      return undefined;
    }
  }

  /**
   * Build a consistent logging context for a workflow run.
   */
  private buildRunLogContext(
    run: WorkflowRunFull,
    mode: RunWorkflowOptions<TriggerEventWrapper>['mode'],
    event: TriggerEventWrapper,
  ): Record<string, unknown> {
    return {
      mode,
      runId: run.id,
      workflowId: run.workflow?.id,
      subscriberId: run.triggeredBy?.id ?? null,
      messageId: this.safeInvoke(() => event.getId()),
      eventType: this.safeInvoke(() => event.getEventType()),
      messageType: this.safeInvoke(() => event.getMessageType()),
    };
  }

  /**
   * Retrieve the internal runner state from the workflow runner instance.
   */
  private getRunnerState(runner: WorkflowRunner): ExecutionState | undefined {
    return (runner as any).state as ExecutionState | undefined;
  }

  /**
   * Extract a context snapshot suitable for persistence.
   */
  private getContextState(
    context?: WorkflowRuntimeContext,
  ): Record<string, unknown> | null {
    if (!context?.state || Object.keys(context.state).length === 0) {
      return null;
    }

    return { ...context.state };
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
    const state = this.getRunnerState(runner);
    const metadata = this.buildMetadata(state, run.metadata);

    this.logger.error(
      'Persisting failed workflow run after runner crash',
      error,
      {
        runId: run.id,
        workflowId: run.workflow?.id,
        subscriberId: run.triggeredBy?.id ?? null,
      },
    );
    await this.workflowRunService.markFailed(run.id, {
      snapshot: runner.getSnapshot(),
      memory: state?.memory ?? null,
      context: contextState,
      error: this.stringifyError(error),
    });

    await this.workflowRunService.updateOne(run.id, {
      input: state?.input ?? run.input ?? {},
      output: state?.output ?? run.output ?? null,
      memory: state?.memory ?? run.memory ?? null,
      metadata,
      context: contextState,
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
