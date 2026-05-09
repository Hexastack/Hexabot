/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Action } from '../action/action.types';
import { BaseWorkflowContext, type StepExecutionRecord } from '../context';
import type { RuntimeSuspensionRequest } from '../runner-runtime-control';
import { createDeferred } from '../utils/deferred';
import {
  type EventEmitterLike,
  type StepInfo,
  StepType,
} from '../workflow-event-emitter';
import type {
  CompiledTask,
  CompiledWorkflow,
  ExecutionState,
  TaskStep,
} from '../workflow-types';

import { executeTaskStep } from './task-executor';
import type { StepExecutorEnv } from './types';

class TestContext extends BaseWorkflowContext {
  public eventEmitter: EventEmitterLike = { emit: jest.fn(), on: jest.fn() };

  constructor() {
    super({});
  }
}

const createState = (): ExecutionState => ({
  input: {},
  output: {},
  iterationStack: [],
});
const createAction = (
  impl: jest.Mock,
): Action<unknown, unknown, BaseWorkflowContext, any> =>
  ({
    name: 'mock_action',
    description: 'runs a task',
    inputSchema: {} as any,
    outputSchema: {} as any,
    execute: jest.fn(),
    parseInput: jest.fn(),
    parseOutput: jest.fn(),
    parseSettings: jest.fn(),
    run: impl,
  }) as Action<unknown, unknown, BaseWorkflowContext, any>;
const createTask = (runImpl: jest.Mock): CompiledTask => ({
  name: 'test_task',
  definition: {} as any,
  actionName: 'mock_action',
  action: createAction(runImpl),
  inputs: { payload: { kind: 'literal', value: 123 } },
  settings: {} as any,
  bindings: {
    tools: { calculate: { action: 'calculate_score', settings: {} } },
  },
});
const createCompiled = (task: CompiledTask): CompiledWorkflow =>
  ({
    definition: {} as any,
    tasks: { [task.name]: task },
    flow: [],
    outputMapping: {},
    inputParser: { parse: (value: unknown) => value } as any,
  }) as CompiledWorkflow;
const createEnv = (
  compiled: CompiledWorkflow,
  stepInfo: StepInfo,
): StepExecutorEnv => {
  const stepRecords: Record<string, StepExecutionRecord> = {};

  return {
    compiled,
    context: new TestContext(),
    runId: 'run-123',
    buildInstanceStepInfo: jest.fn().mockReturnValue(stepInfo),
    markSnapshot: jest.fn(),
    recordStepExecution: jest.fn((step, update) => {
      const existing =
        stepRecords[step.id] ??
        ({
          id: step.id,
          name: step.name,
          status: 'pending',
        } satisfies StepExecutionRecord);
      const context =
        existing.context || update.context
          ? { ...existing.context, ...update.context }
          : undefined;
      const nextRecord = {
        ...existing,
        ...update,
        id: step.id,
        name: step.name,
        status: update.status ?? existing.status,
        context,
      } satisfies StepExecutionRecord;

      stepRecords[step.id] = nextRecord;

      return nextRecord;
    }),
    emit: jest.fn(),
    setCurrentStep: jest.fn(),
    waitForStepSuspension: jest
      .fn()
      .mockImplementation(
        () => new Promise<RuntimeSuspensionRequest>(() => undefined),
      ),
    clearStepSuspensions: jest.fn(),
    primeStepResumeData: jest.fn(),
    captureTaskOutput: jest.fn().mockResolvedValue(undefined),
    executeFlow: jest.fn(),
    executeStep: jest.fn(),
  };
};
const step: TaskStep = {
  id: '0:test_task',
  type: StepType.Task,
  label: 'test_task',
  taskName: 'test_task',
};
const stepInfo: StepInfo = {
  id: step.id,
  name: step.label,
  type: StepType.Task,
};

describe('executeTaskStep', () => {
  it('runs the task, records snapshots, and emits success events', async () => {
    const task = createTask(jest.fn().mockResolvedValue({ result: 'ok' }));
    const compiled = createCompiled(task);
    const env = createEnv(compiled, stepInfo);
    const state = createState();
    const result = await executeTaskStep(env, step, state, []);

    expect(result).toBeUndefined();
    expect(env.buildInstanceStepInfo).toHaveBeenCalledWith(
      step,
      state.iterationStack,
    );
    expect(task.action.run).toHaveBeenCalledWith(
      { payload: 123 },
      env.context,
      task.settings,
      task.bindings,
    );
    expect(env.setCurrentStep).toHaveBeenNthCalledWith(1, stepInfo);
    expect(env.markSnapshot).toHaveBeenNthCalledWith(1, stepInfo, 'running');
    expect(env.markSnapshot).toHaveBeenNthCalledWith(2, stepInfo, 'completed');
    expect(env.recordStepExecution).toHaveBeenNthCalledWith(
      1,
      stepInfo,
      expect.objectContaining({
        action: 'mock_action',
        status: 'running',
        startedAt: expect.any(Number),
        input: { payload: 123 },
        context: { before: {} },
      }),
    );
    expect(env.recordStepExecution).toHaveBeenNthCalledWith(
      2,
      stepInfo,
      expect.objectContaining({
        status: 'completed',
        endedAt: expect.any(Number),
        output: { result: 'ok' },
        context: { after: {} },
      }),
    );
    expect(env.captureTaskOutput).toHaveBeenCalledWith(task, state, {
      result: 'ok',
    });
    expect(env.emit).toHaveBeenCalledWith('hook:step:start', {
      runId: 'run-123',
      step: stepInfo,
      stepExecution: expect.objectContaining({
        id: stepInfo.id,
        status: 'running',
      }),
    });
    expect(env.emit).toHaveBeenCalledWith('hook:step:success', {
      runId: 'run-123',
      step: stepInfo,
      stepExecution: expect.objectContaining({
        id: stepInfo.id,
        status: 'completed',
      }),
    });
    expect(env.setCurrentStep).toHaveBeenLastCalledWith(undefined);
  });

  it('throws when the task is missing', async () => {
    const compiled = createCompiled(createTask(jest.fn()));
    compiled.tasks = {};
    const env = createEnv(compiled, stepInfo);
    const state = createState();

    await expect(executeTaskStep(env, step, state, [])).rejects.toThrow(
      'Task "test_task" is not defined.',
    );
    expect(env.buildInstanceStepInfo).not.toHaveBeenCalled();
  });

  it('resumes an in-flight action and captures post-suspend output', async () => {
    const request: RuntimeSuspensionRequest = {
      stepId: step.id,
      stepExecId: `${step.id}#1`,
      suspendIndex: 1,
      suspendKey: 'index:1',
      reason: 'awaiting_user',
      data: { channel: 'sms' },
      awaitResults: {},
      resume: createDeferred<unknown>(),
    };
    const task = createTask(
      jest.fn().mockImplementation(async () => {
        const resumed = (await request.resume.promise) as { reply: string };

        return { reply: resumed.reply.toUpperCase() };
      }),
    );
    const compiled = createCompiled(task);
    const env = createEnv(compiled, stepInfo);
    const state = createState();

    (env.waitForStepSuspension as jest.Mock)
      .mockResolvedValueOnce(request)
      .mockImplementationOnce(
        () => new Promise<RuntimeSuspensionRequest>(() => undefined),
      );

    const suspension = await executeTaskStep(env, step, state, []);

    expect(suspension).toEqual(
      expect.objectContaining({
        step: stepInfo,
        reason: 'awaiting_user',
        data: { channel: 'sms' },
      }),
    );
    expect(env.markSnapshot).toHaveBeenCalledWith(
      stepInfo,
      'suspended',
      'awaiting_user',
    );
    expect(env.emit).toHaveBeenCalledWith('hook:step:suspended', {
      runId: 'run-123',
      step: stepInfo,
      stepExecution: expect.objectContaining({
        id: stepInfo.id,
        status: 'suspended',
      }),
      reason: 'awaiting_user',
      data: { channel: 'sms' },
    });

    await suspension?.continue({ reply: 'Sure' });

    expect(env.captureTaskOutput).toHaveBeenCalledWith(task, state, {
      reply: 'SURE',
    });
    expect(env.recordStepExecution).toHaveBeenCalledWith(
      stepInfo,
      expect.objectContaining({
        status: 'completed',
        output: { reply: 'SURE' },
      }),
    );
    expect(env.emit).toHaveBeenCalledWith('hook:step:success', {
      runId: 'run-123',
      step: stepInfo,
      stepExecution: expect.objectContaining({
        id: stepInfo.id,
        status: 'completed',
      }),
    });
  });

  it('marks failure and rethrows errors from the task', async () => {
    const task = createTask(jest.fn().mockRejectedValue(new Error('boom')));
    const compiled = createCompiled(task);
    const env = createEnv(compiled, stepInfo);
    const state = createState();

    await expect(executeTaskStep(env, step, state, [])).rejects.toThrow('boom');
    expect(env.recordStepExecution).toHaveBeenCalledWith(
      stepInfo,
      expect.objectContaining({
        status: 'failed',
        endedAt: expect.any(Number),
        error: { message: 'boom', stack: expect.any(String) },
        context: { after: {} },
      }),
    );
    expect(env.markSnapshot).toHaveBeenCalledWith(stepInfo, 'failed', 'boom');
    expect(env.emit).toHaveBeenCalledWith('hook:step:error', {
      runId: 'run-123',
      step: stepInfo,
      stepExecution: expect.objectContaining({
        id: stepInfo.id,
        status: 'failed',
      }),
      error: expect.any(Error),
    });
    expect(env.setCurrentStep).toHaveBeenLastCalledWith(undefined);
  });
});
