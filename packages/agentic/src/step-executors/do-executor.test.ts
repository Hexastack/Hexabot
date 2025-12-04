import type { Action } from '../action/action.types';
import { BaseWorkflowContext } from '../context';
import { WorkflowSuspendedError } from '../runtime-error';
import type {
  CompiledTask,
  CompiledWorkflow,
  DoStep,
  ExecutionState,
} from '../workflow-types';
import type { StepInfo } from '../workflow-event-emitter';
import { executeDoStep } from './do-executor';
import type { StepExecutorEnv } from './types';

class TestContext extends BaseWorkflowContext {
  constructor() {
    super();
  }
}

const createState = (): ExecutionState => ({
  input: {},
  memory: {},
  output: {},
  iterationStack: [],
});

const createAction = (impl: jest.Mock): Action<unknown, unknown, BaseWorkflowContext, any> =>
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
  outputs: {},
  settings: {} as any,
});

const createCompiled = (task: CompiledTask): CompiledWorkflow =>
  ({
    definition: {} as any,
    tasks: { [task.name]: task },
    flow: [],
    outputMapping: {},
    inputParser: { parse: (value: unknown) => value } as any,
  }) as CompiledWorkflow;

const createEnv = (compiled: CompiledWorkflow, stepInfo: StepInfo): StepExecutorEnv => ({
  compiled,
  context: new TestContext(),
  runId: 'run-123',
  buildInstanceStepInfo: jest.fn().mockReturnValue(stepInfo),
  markSnapshot: jest.fn(),
  emit: jest.fn(),
  setCurrentStep: jest.fn(),
  captureTaskOutput: jest.fn().mockResolvedValue(undefined),
  executeFlow: jest.fn(),
  executeStep: jest.fn(),
});

const step: DoStep = {
  id: '0:test_task',
  kind: 'do',
  taskName: 'test_task',
  stepInfo: { id: '0:test_task', name: 'test_task', type: 'task' },
};

describe('executeDoStep', () => {
  it('runs the task, records snapshots, and emits success events', async () => {
    const task = createTask(jest.fn().mockResolvedValue({ result: 'ok' }));
    const compiled = createCompiled(task);
    const stepInfo: StepInfo = { id: '0:test_task', name: 'test_task', type: 'task' };
    const env = createEnv(compiled, stepInfo);
    const state = createState();

    const result = await executeDoStep(env, step, state, []);

    expect(result).toBeUndefined();
    expect(env.buildInstanceStepInfo).toHaveBeenCalledWith(step, state.iterationStack);
    expect(task.action.run).toHaveBeenCalledWith({ payload: 123 }, env.context, task.settings);
    expect(env.setCurrentStep).toHaveBeenNthCalledWith(1, stepInfo);
    expect(env.markSnapshot).toHaveBeenNthCalledWith(1, stepInfo, 'running');
    expect(env.markSnapshot).toHaveBeenNthCalledWith(2, stepInfo, 'completed');
    expect(env.captureTaskOutput).toHaveBeenCalledWith(task, state, { result: 'ok' });
    expect(env.emit).toHaveBeenCalledWith('step:start', { runId: 'run-123', step: stepInfo });
    expect(env.emit).toHaveBeenCalledWith('step:success', { runId: 'run-123', step: stepInfo });
    expect(env.setCurrentStep).toHaveBeenLastCalledWith(undefined);
  });

  it('throws when the task is missing', async () => {
    const compiled = createCompiled(createTask(jest.fn()));
    compiled.tasks = {};
    const env = createEnv(compiled, step.stepInfo);
    const state = createState();

    await expect(executeDoStep(env, step, state, [])).rejects.toThrow(
      'Task "test_task" is not defined.',
    );
    expect(env.buildInstanceStepInfo).not.toHaveBeenCalled();
  });

  it('marks suspension and completes after continuation', async () => {
    const suspensionError = new WorkflowSuspendedError(step.id, {
      reason: 'awaiting_user',
      data: { channel: 'sms' },
    });
    const task = createTask(jest.fn().mockRejectedValue(suspensionError));
    const compiled = createCompiled(task);
    const stepInfo: StepInfo = { id: '0:test_task', name: 'test_task', type: 'task' };
    const env = createEnv(compiled, stepInfo);
    const state = createState();

    const suspension = await executeDoStep(env, step, state, []);

    expect(suspension).toEqual(
      expect.objectContaining({
        step: stepInfo,
        reason: 'awaiting_user',
        data: { channel: 'sms' },
      }),
    );
    expect(env.markSnapshot).toHaveBeenCalledWith(stepInfo, 'suspended', 'awaiting_user');
    expect(env.emit).toHaveBeenCalledWith('step:suspended', {
      runId: 'run-123',
      step: stepInfo,
      reason: 'awaiting_user',
      data: { channel: 'sms' },
    });
    expect(env.captureTaskOutput).not.toHaveBeenCalled();
    expect(env.setCurrentStep).toHaveBeenLastCalledWith(undefined);

    const continuation = suspension?.continue;
    expect(continuation).toBeDefined();
    await continuation?.({ reply: 'Sure' });

    expect(env.captureTaskOutput).toHaveBeenCalledWith(task, state, {
      reply: 'Sure',
    });
    expect(env.markSnapshot).toHaveBeenCalledWith(stepInfo, 'completed');
    expect(env.emit).toHaveBeenCalledWith('step:success', { runId: 'run-123', step: stepInfo });
  });

  it('marks failure and rethrows errors from the task', async () => {
    const task = createTask(jest.fn().mockRejectedValue(new Error('boom')));
    const compiled = createCompiled(task);
    const env = createEnv(compiled, step.stepInfo);
    const state = createState();

    await expect(executeDoStep(env, step, state, [])).rejects.toThrow('boom');
    expect(env.markSnapshot).toHaveBeenCalledWith(step.stepInfo, 'failed', 'boom');
    expect(env.emit).toHaveBeenCalledWith('step:error', {
      runId: 'run-123',
      step: step.stepInfo,
      error: expect.any(Error),
    });
    expect(env.setCurrentStep).toHaveBeenLastCalledWith(undefined);
  });
});
