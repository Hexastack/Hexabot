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
import EventWrapper from '@/channel/lib/EventWrapper';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { LoggerService } from '@/logger/logger.service';
import { WorkflowRunFull } from '@/workflow/dto/workflow-run.dto';
import { Workflow as WorkflowDto } from '@/workflow/dto/workflow.dto';

import { RunStrategy, RunWorkflowOptions, WorkflowResult } from '../types';

import { WorkflowContext } from './workflow-context';
import { WorkflowRunService } from './workflow-run.service';
import { WorkflowService } from './workflow.service';

@Injectable()
export class AgenticService {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly actionService: ActionService,
    private readonly logger: LoggerService,
    private readonly workflowContext: WorkflowContext,
  ) {}

  /**
   * Process an incoming channel event by resuming a suspended workflow run if it exists,
   * otherwise start a new run using the latest configured workflow (or the default fallback).
   */
  async handleMessageEvent(event: EventWrapper<any, any>): Promise<void> {
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
  private async runWorkflow(options: RunWorkflowOptions): Promise<void> {
    const { event } = options;
    const run =
      options.mode === 'start'
        ? await this.createRun(options.workflow, options.subscriber, event)
        : options.run;
    const workflowInstance = AgentWorkflow.fromDefinition(
      run.workflow.definition,
      this.buildActionsRegistry(),
    );
    const context = this.workflowContext.buildFromRun(run, event);
    const contextState = this.getContextState(context);
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

  /**
   * Build the execution strategy for starting a new workflow or resuming an existing one.
   */
  private async createRunStrategy(
    mode: RunWorkflowOptions['mode'],
    run: WorkflowRunFull,
    context: WorkflowContext,
    workflowInstance: AgentWorkflow,
    event: EventWrapper<any, any>,
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
  ): Promise<void> {
    const contextState = this.getContextState(runtimeContext);
    const state = this.getRunnerState(runner);
    const metadata = this.buildMetadata(state, run.metadata);
    const output = this.pickOutput(result, state, run.output);

    switch (result.status) {
      case 'suspended':
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
        await this.workflowRunService.markFinished(run.id, {
          snapshot: result.snapshot,
          memory: state?.memory ?? null,
          context: contextState,
          output: result.output ?? output,
        });
        break;
      case 'failed':
      default:
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
  private buildInput(event: EventWrapper<any, any>): Record<string, unknown> {
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
  private buildResumeData(
    event: EventWrapper<any, any>,
  ): Record<string, unknown> | undefined {
    const message = this.safeInvoke(() => event.getMessage());

    return message === undefined ? undefined : { message };
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
   * Retrieve the internal runner state from the workflow runner instance.
   */
  private getRunnerState(runner: WorkflowRunner): ExecutionState | undefined {
    return (runner as any).state as ExecutionState | undefined;
  }

  /**
   * Extract a context snapshot suitable for persistence.
   */
  private getContextState(
    context?: WorkflowContext,
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
