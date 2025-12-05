import { BaseWorkflowContext } from '../context';
import type {
  CompiledStep,
  ConditionalStep,
  ExecutionState,
  Suspension,
} from '../workflow-types';
import type { StepInfo } from '../workflow-event-emitter';
import { executeConditional } from './conditional-executor';
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

const createDoStep = (id: string): CompiledStep => ({
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

describe('executeConditional', () => {
  it('executes the first matching branch', async () => {
    const env = createEnv();
    const state = createState();
    const step: ConditionalStep = {
      id: 'conditional',
      kind: 'conditional',
      stepInfo: { id: 'conditional', name: 'conditional', type: 'conditional' },
      branches: [
        { id: 'branch-0', condition: { kind: 'literal', value: false }, steps: [createDoStep('a')] },
        { id: 'branch-1', condition: { kind: 'literal', value: true }, steps: [createDoStep('b')] },
        { id: 'branch-2', condition: { kind: 'literal', value: true }, steps: [createDoStep('c')] },
      ],
    };
    env.executeFlow = jest.fn().mockResolvedValue(undefined);

    const result = await executeConditional(env, step, state, [0]);

    expect(result).toBeUndefined();
    expect(env.executeFlow).toHaveBeenCalledTimes(1);
    expect(env.executeFlow).toHaveBeenCalledWith(step.branches[1].steps, state, [0, 'branch', 1]);
  });

  it('wraps and resumes from a suspended branch', async () => {
    const env = createEnv();
    const state = createState();
    const innerSuspension: Suspension = {
      step: { id: 'inner', name: 'inner', type: 'task' } as StepInfo,
      reason: 'pause',
      continue: jest.fn().mockResolvedValue(undefined),
    };
    env.executeFlow = jest.fn().mockResolvedValue(innerSuspension);

    const step: ConditionalStep = {
      id: 'conditional',
      kind: 'conditional',
      stepInfo: { id: 'conditional', name: 'conditional', type: 'conditional' },
      branches: [{ id: 'branch-0', steps: [createDoStep('a')] }],
    };

    const suspension = await executeConditional(env, step, state, []);
    expect(suspension).toEqual(expect.objectContaining({ step: innerSuspension.step, reason: 'pause' }));
    expect(env.executeFlow).toHaveBeenCalledTimes(1);

    await suspension?.continue('resume-data');
    expect(innerSuspension.continue).toHaveBeenCalledWith('resume-data');
    expect(env.executeFlow).toHaveBeenCalledTimes(1);
  });

  it('forwards nested suspensions from branch continuation', async () => {
    const env = createEnv();
    const state = createState();
    const nextSuspension: Suspension = {
      step: { id: 'next', name: 'next', type: 'task' } as StepInfo,
      continue: jest.fn(),
    };
    const innerSuspension: Suspension = {
      step: { id: 'inner', name: 'inner', type: 'task' } as StepInfo,
      continue: jest.fn().mockResolvedValue(nextSuspension),
    };
    env.executeFlow = jest.fn().mockResolvedValue(innerSuspension);

    const step: ConditionalStep = {
      id: 'conditional',
      kind: 'conditional',
      stepInfo: { id: 'conditional', name: 'conditional', type: 'conditional' },
      branches: [{ id: 'branch-0', steps: [createDoStep('a')] }],
    };

    const suspension = await executeConditional(env, step, state, []);
    const result = await suspension?.continue('resume-data');

    expect(result).toBe(nextSuspension);
    expect(innerSuspension.continue).toHaveBeenCalledWith('resume-data');
    expect(env.executeFlow).toHaveBeenCalledTimes(1);
  });

  it('returns undefined when no branch matches', async () => {
    const env = createEnv();
    const state = createState();
    const step: ConditionalStep = {
      id: 'conditional',
      kind: 'conditional',
      stepInfo: { id: 'conditional', name: 'conditional', type: 'conditional' },
      branches: [
        { id: 'branch-0', condition: { kind: 'literal', value: false }, steps: [createDoStep('a')] },
        { id: 'branch-1', condition: { kind: 'literal', value: false }, steps: [createDoStep('b')] },
      ],
    };

    const result = await executeConditional(env, step, state, []);

    expect(result).toBeUndefined();
    expect(env.executeFlow).not.toHaveBeenCalled();
  });
});
