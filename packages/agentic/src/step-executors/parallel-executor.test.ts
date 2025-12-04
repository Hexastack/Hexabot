import { BaseWorkflowContext } from '../context';
import type {
  CompiledStep,
  ExecutionState,
  ParallelStep,
  Suspension,
} from '../workflow-types';
import type { StepInfo } from '../workflow-event-emitter';
import { executeParallel } from './parallel-executor';
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

const createChild = (id: string): CompiledStep => ({
  id,
  kind: 'do',
  taskName: `task_${id}`,
  stepInfo: { id, name: id, type: 'task' },
});

const createEnv = (): StepExecutorEnv => {
  const compiled = {
    definition: {} as any,
    tasks: {},
    flow: [],
    outputMapping: {},
    inputParser: { parse: (value: unknown) => value } as any,
  } as any;

  return {
    compiled,
    context: new TestContext(),
    runId: 'run-1',
    buildInstanceStepInfo: jest.fn(),
    markSnapshot: jest.fn(),
    emit: jest.fn(),
    setCurrentStep: jest.fn(),
    captureTaskOutput: jest.fn(),
    executeFlow: jest.fn(),
    executeStep: jest.fn(),
  };
};

describe('executeParallel', () => {
  it('executes all children when using wait_all', async () => {
    const env = createEnv();
    const state = createState();
    const step: ParallelStep = {
      id: 'parallel',
      kind: 'parallel',
      strategy: 'wait_all',
      steps: [createChild('a'), createChild('b')],
      stepInfo: { id: 'parallel', name: 'parallel', type: 'parallel' },
    };
    env.executeStep = jest.fn().mockResolvedValue(undefined);

    const result = await executeParallel(env, step, state, [0]);

    expect(result).toBeUndefined();
    expect(env.executeStep).toHaveBeenCalledTimes(2);
    expect(env.executeStep).toHaveBeenNthCalledWith(1, step.steps[0], state, [0, 0]);
    expect(env.executeStep).toHaveBeenNthCalledWith(2, step.steps[1], state, [0, 1]);
  });

  it('short-circuits on first completion when using wait_any', async () => {
    const env = createEnv();
    const state = createState();
    const step: ParallelStep = {
      id: 'parallel',
      kind: 'parallel',
      strategy: 'wait_any',
      steps: [createChild('a'), createChild('b')],
      stepInfo: { id: 'parallel', name: 'parallel', type: 'parallel' },
    };
    env.executeStep = jest.fn().mockResolvedValue(undefined);

    const result = await executeParallel(env, step, state, []);

    expect(result).toBeUndefined();
    expect(env.executeStep).toHaveBeenCalledTimes(1);
    expect(env.executeStep).toHaveBeenCalledWith(step.steps[0], state, [0]);
  });

  it('continues remaining steps after resuming from suspension (wait_all)', async () => {
    const env = createEnv();
    const state = createState();
    const innerSuspension: Suspension = {
      step: { id: 'a', name: 'a', type: 'task' } as StepInfo,
      continue: jest.fn().mockResolvedValue(undefined),
    };
    const step: ParallelStep = {
      id: 'parallel',
      kind: 'parallel',
      strategy: 'wait_all',
      steps: [createChild('a'), createChild('b')],
      stepInfo: { id: 'parallel', name: 'parallel', type: 'parallel' },
    };
    env.executeStep = jest
      .fn()
      .mockResolvedValueOnce(innerSuspension)
      .mockResolvedValueOnce(undefined);

    const suspension = await executeParallel(env, step, state, []);
    expect(suspension).toEqual(expect.objectContaining({ step: innerSuspension.step }));

    const result = await suspension?.continue('resume-data');
    expect(result).toBeUndefined();
    expect(innerSuspension.continue).toHaveBeenCalledWith('resume-data');
    expect(env.executeStep).toHaveBeenCalledTimes(2);
    expect(env.executeStep).toHaveBeenLastCalledWith(step.steps[1], state, [1]);
  });

  it('stops after resuming a suspended child when using wait_any', async () => {
    const env = createEnv();
    const state = createState();
    const innerSuspension: Suspension = {
      step: { id: 'a', name: 'a', type: 'task' } as StepInfo,
      continue: jest.fn().mockResolvedValue(undefined),
    };
    const step: ParallelStep = {
      id: 'parallel',
      kind: 'parallel',
      strategy: 'wait_any',
      steps: [createChild('a'), createChild('b')],
      stepInfo: { id: 'parallel', name: 'parallel', type: 'parallel' },
    };
    env.executeStep = jest.fn().mockResolvedValueOnce(innerSuspension);

    const suspension = await executeParallel(env, step, state, []);
    const result = await suspension?.continue('resume-data');

    expect(result).toBeUndefined();
    expect(innerSuspension.continue).toHaveBeenCalledWith('resume-data');
    expect(env.executeStep).toHaveBeenCalledTimes(1);
  });
});
