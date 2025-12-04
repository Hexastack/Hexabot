/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Workflow as AgentWorkflow,
  ExecutionState,
  WorkflowDefinition,
  WorkflowEventEmitter,
  WorkflowResumeResult,
  WorkflowRunner,
  WorkflowSnapshot,
  WorkflowStartResult,
} from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';

import { ActionService } from '@/actions/actions.service';
import { WorkflowContext } from '@/actions/workflow-context';
import EventWrapper from '@/channel/lib/EventWrapper';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { LoggerService } from '@/logger/logger.service';
import { WorkflowRunFull } from '@/workflow/dto/workflow-run.dto';
import { Workflow as WorkflowDto } from '@/workflow/dto/workflow.dto';

import { WorkflowRunService } from './workflow-run.service';
import { WorkflowService } from './workflow.service';

type WorkflowResult = WorkflowStartResult | WorkflowResumeResult;
type RunWorkflowOptions =
  | {
      mode: 'start';
      workflow: WorkflowDto;
      subscriber: Subscriber;
      event: EventWrapper<any, any>;
    }
  | {
      mode: 'resume';
      run: WorkflowRunFull;
      event: EventWrapper<any, any>;
    };
type MarkRunningInput = {
  snapshot?: WorkflowSnapshot | null;
  memory?: Record<string, unknown> | null;
  lastResumeData?: unknown;
};
type RunStrategy = {
  runner: WorkflowRunner;
  markRunningInput: MarkRunningInput;
  resumeData?: unknown;
  execute: () => Promise<WorkflowResult>;
};

@Injectable()
export class AgenticService {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly actionService: ActionService,
    private readonly moduleRef: ModuleRef,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Process an incoming channel event by resuming a suspended workflow run if it exists,
   * otherwise start a new run using the latest configured workflow (or the default fallback).
   */
  async handleMessageEvent(event: EventWrapper<any, any>) {
    const subscriber = event.getSender();
    if (!subscriber) {
      this.logger.warn(
        'Skipping workflow execution due to missing subscriber on event',
      );

      return;
    }

    try {
      const suspendedRun =
        await this.workflowRunService.findSuspendedRunBySubscriber(
          subscriber.id,
        );
      if (suspendedRun) {
        await this.runWorkflow({ mode: 'resume', run: suspendedRun, event });

        return;
      }

      const workflow = await this.workflowService.pickWorkflow();
      if (!workflow) {
        this.logger.warn('No workflow available to handle incoming event');

        return;
      }

      await this.runWorkflow({
        mode: 'start',
        workflow,
        subscriber,
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
   * Shared runner lifecycle for starting or resuming a workflow.
   */
  private async runWorkflow(options: RunWorkflowOptions) {
    const { event } = options;
    const run =
      options.mode === 'start'
        ? await this.createRun(options.workflow, options.subscriber, event)
        : options.run;
    const workflowInstance = this.buildWorkflow(run.workflow.definition);
    const context = await this.buildContext(run, event);
    const contextState = this.extractContextState(context, run.context);
    const strategy = await this.createRunStrategy(
      options.mode,
      run,
      context,
      workflowInstance,
      event,
    );

    await this.workflowRunService.markRunning(run.id, {
      ...strategy.markRunningInput,
      context: contextState,
    });

    let result: WorkflowResult;
    try {
      result = await strategy.execute();
    } catch (err) {
      await this.markRunFailed(run, strategy.runner, contextState, err);

      throw err;
    }

    await this.persistResult(
      run,
      strategy.runner,
      result,
      strategy.resumeData,
      context,
    );
  }

  private async createRunStrategy(
    mode: RunWorkflowOptions['mode'],
    run: WorkflowRunFull,
    context: WorkflowContext,
    workflowInstance: AgentWorkflow,
    event: EventWrapper<any, any>,
  ): Promise<RunStrategy> {
    const eventEmitter = this.buildEventEmitter(run.id);

    if (mode === 'start') {
      const runner = await workflowInstance.buildAsyncRunner({
        eventEmitter,
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

    const runner = await workflowInstance.buildRunnerFromState({
      state: this.buildExecutionState(run),
      context,
      snapshot: run.snapshot ?? { status: run.status, actions: {} },
      suspension: run.suspendedStep
        ? {
            stepId: run.suspendedStep,
            reason: run.suspensionReason,
            data: run.suspensionData ?? undefined,
          }
        : undefined,
      eventEmitter,
      runId: run.id,
      lastResumeData: run.lastResumeData,
    });
    const resumeData = this.buildResumeData(event);

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
    subscriber: Subscriber,
    event: EventWrapper<any, any>,
  ): Promise<WorkflowRunFull> {
    const run = await this.workflowRunService.create({
      workflow: workflow.id,
      subscriber: subscriber.id,
      input: this.buildInput(event),
      memory: workflow.definition.memory ?? null,
      context: workflow.definition.context ?? null,
      metadata: { channel: event.getChannelData() },
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
    runtimeContext?: WorkflowContext,
  ) {
    const state = this.getRunnerState(runner);
    const metadata = this.buildMetadata(state, run.metadata);
    const output = this.pickOutput(result, state, run.output);
    const context = this.extractContextState(runtimeContext, run.context);

    switch (result.status) {
      case 'suspended':
        await this.workflowRunService.markSuspended(run.id, {
          stepId: result.step.id,
          reason: result.reason,
          data: result.data,
          snapshot: result.snapshot,
          memory: state?.memory ?? null,
          context,
          lastResumeData: resumeData,
        });
        break;
      case 'finished':
        await this.workflowRunService.markFinished(run.id, {
          snapshot: result.snapshot,
          memory: state?.memory ?? null,
          context,
          output: result.output ?? output,
        });
        break;
      case 'failed':
      default:
        await this.workflowRunService.markFailed(run.id, {
          snapshot: result.snapshot,
          memory: state?.memory ?? null,
          context,
          error: this.stringifyError(result.error),
        });
        break;
    }

    await this.workflowRunService.updateOne(run.id, {
      input: state?.input ?? run.input ?? {},
      output,
      memory: state?.memory ?? run.memory ?? null,
      metadata,
      context,
    });
  }

  /**
   * Prepare a workflow instance from its definition and registered actions.
   */
  private buildWorkflow(definition: WorkflowDefinition) {
    return AgentWorkflow.fromDefinition(
      definition,
      this.buildActionsRegistry(),
    );
  }

  /**
   * Build a workflow execution context for a run.
   */
  private async buildContext(
    run: WorkflowRunFull,
    event: EventWrapper<any, any>,
  ): Promise<WorkflowContext> {
    const context = await this.moduleRef.resolve(WorkflowContext, undefined, {
      strict: false,
    });

    this.hydrateContext(context, run.context);
    context.event = event;
    context.subscriberId = run.subscriber?.id;
    context.conversationId = run.id;
    context.runId = run.id;

    return context;
  }

  /**
   * Merge persisted context fields back into the runtime context instance.
   */
  private hydrateContext(
    context: WorkflowContext,
    stored?: Record<string, unknown> | null,
  ) {
    if (!stored) {
      return;
    }

    const forbidden = new Set(['services', 'workflow']);
    Object.entries(stored).forEach(([key, value]) => {
      if (forbidden.has(key)) {
        return;
      }

      (context as any)[key] = value;
    });
  }

  /**
   * Extract a serializable snapshot of the workflow context, excluding framework internals.
   */
  private extractContextState(
    runtimeContext?: WorkflowContext,
    fallback?: Record<string, unknown> | null,
  ): Record<string, unknown> | null {
    if (!runtimeContext) {
      return fallback ?? null;
    }

    const forbidden = new Set(['services', 'workflow', 'event']);
    const next: Record<string, unknown> = {};

    Object.entries(runtimeContext).forEach(([key, value]) => {
      if (forbidden.has(key)) {
        return;
      }

      if (value !== undefined) {
        next[key] = value as unknown;
      }
    });

    const merged = { ...(fallback ?? {}), ...next };

    return Object.keys(merged).length > 0 ? merged : null;
  }

  /**
   * Build the ExecutionState used to rebuild a runner.
   */
  private buildExecutionState(run: WorkflowRunFull): ExecutionState {
    const state: ExecutionState = {
      input: run.input ?? {},
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
  private buildInput(event: EventWrapper<any, any>) {
    const input: Record<string, unknown> = {
      channel: event.getChannelData(),
      message_type: event.getMessageType(),
      event_type: event.getEventType(),
      sender: event.getSender(),
      payload: this.safeInvoke(() => event.getPayload()),
      message: this.safeInvoke(() => event.getMessage()),
      text: event.getText(),
    };
    const id = this.safeInvoke(() => event.getId());
    if (id) {
      input.mid = id;
    }

    return input;
  }

  /**
   * Extract the resume payload expected by messaging actions.
   */
  private buildResumeData(event: EventWrapper<any, any>) {
    return this.safeInvoke(() => event.getMessage());
  }

  /**
   * Build a mapping of registered actions keyed by their names.
   */
  private buildActionsRegistry() {
    return Object.fromEntries(
      this.actionService.getAll().map((action) => [action.getName(), action]),
    );
  }

  /**
   * Create an event emitter used by the workflow runner for observability.
   */
  private buildEventEmitter(runId: string) {
    const emitter = new WorkflowEventEmitter();
    emitter.on('workflow:failure', ({ error }) =>
      this.logger.error(`Workflow ${runId} failed`, error),
    );
    emitter.on('workflow:suspended', ({ step, reason }) =>
      this.logger.debug(
        `Workflow ${runId} suspended at step ${step.id}`,
        reason,
      ),
    );
    emitter.on('workflow:finish', ({ output }) =>
      this.logger.debug(`Workflow ${runId} finished`, output),
    );

    return emitter;
  }

  private safeInvoke<T>(fn: () => T): T | undefined {
    try {
      const value = fn();

      return value === undefined ? undefined : value;
    } catch {
      return undefined;
    }
  }

  private getRunnerState(runner: WorkflowRunner): ExecutionState | undefined {
    return (runner as any).state as ExecutionState | undefined;
  }

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

  private async markRunFailed(
    run: WorkflowRunFull,
    runner: WorkflowRunner,
    contextState: Record<string, unknown> | null,
    error: unknown,
  ) {
    const state = this.getRunnerState(runner);
    const metadata = this.buildMetadata(state, run.metadata);

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

  private stringifyError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return typeof error === 'string' ? error : JSON.stringify(error);
  }
}
