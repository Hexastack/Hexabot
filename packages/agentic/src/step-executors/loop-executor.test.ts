import { BaseWorkflowContext } from '../context';
import { compileValue } from '../workflow-values';
import type {
  CompiledStep,
  ExecutionState,
  LoopStep,
  Suspension,
} from '../workflow-types';
import type { StepInfo } from '../workflow-event-emitter';
import {
  executeLoop,
  shouldStopLoop,
  updateAccumulator,
} from './loop-executor';
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

const createEnv = (executeFlow: jest.Mock): StepExecutorEnv => {
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
    runId: 'run-loop',
    buildInstanceStepInfo: jest.fn(),
    markSnapshot: jest.fn(),
    emit: jest.fn(),
    setCurrentStep: jest.fn(),
    captureTaskOutput: jest.fn(),
    executeFlow,
    executeStep: jest.fn(),
  };
};

const createDoStep = (id: string): CompiledStep => ({
  id,
  kind: 'do',
  taskName: `task_${id}`,
  stepInfo: { id, name: id, type: 'task' },
});

describe('executeLoop', () => {
  it('iterates items, accumulates values, and stops when the until condition is met', async () => {
    const flowCalls: Array<{ index: number; item: unknown }> = [];
    const executeFlow = jest.fn(async (_steps: CompiledStep[], iterationState: ExecutionState) => {
      flowCalls.push(iterationState.iteration as { index: number; item: unknown });
      iterationState.output[`item_${iterationState.iteration?.index}`] = iterationState.iteration?.item;
      return undefined;
    });
    const env = createEnv(executeFlow);
    const state = createState();
    const step: LoopStep = {
      id: 'loop',
      kind: 'loop',
      name: 'collector',
      stepInfo: { id: 'loop', name: 'loop', type: 'loop' },
      forEach: { item: 'entry', in: { kind: 'literal', value: [2, 4, 6] } },
      until: compileValue('=$accumulator >= 6'),
      accumulate: {
        as: 'sum',
        initial: 0,
        merge: compileValue('=$accumulator + $iteration.item'),
      },
      steps: [createDoStep('child')],
    };

    const result = await executeLoop(env, step, state, []);

    expect(result).toBeUndefined();
    expect(flowCalls).toEqual([
      { item: 2, index: 0 },
      { item: 4, index: 1 },
      { item: 6, index: 2 },
    ]);
    expect(state.output.collector).toEqual({ sum: 12 });
    expect(state.accumulator).toBe(12);
    expect(state.output).toMatchObject({ item_0: 2, item_1: 4, item_2: 6 });
  });

  it('resumes after suspension and continues remaining iterations', async () => {
    const innerSuspension: Suspension = {
      step: { id: 'child', name: 'child', type: 'task' } as StepInfo,
      continue: jest.fn().mockResolvedValue(undefined),
    };
    const executeFlow = jest
      .fn()
      .mockResolvedValueOnce(innerSuspension)
      .mockImplementationOnce(async (_steps: CompiledStep[], iterationState: ExecutionState) => {
        iterationState.output[`item_${iterationState.iteration?.index}`] = iterationState.iteration?.item;
        return undefined;
      });
    const env = createEnv(executeFlow);
    const state = createState();
    const step: LoopStep = {
      id: 'loop',
      kind: 'loop',
      name: 'collector',
      stepInfo: { id: 'loop', name: 'loop', type: 'loop' },
      forEach: { item: 'entry', in: { kind: 'literal', value: [1, 2] } },
      until: compileValue('=$iteration.index >= 1'),
      accumulate: {
        as: 'sum',
        initial: 0,
        merge: compileValue('=$accumulator + $iteration.item'),
      },
      steps: [createDoStep('child')],
    };

    const suspension = await executeLoop(env, step, state, []);
    expect(suspension).toEqual(expect.objectContaining({ step: innerSuspension.step }));

    const result = await suspension?.continue({ resumed: true });

    expect(result).toBeUndefined();
    expect(innerSuspension.continue).toHaveBeenCalledWith({ resumed: true });
    expect(executeFlow).toHaveBeenCalledTimes(2);
    expect(executeFlow).toHaveBeenNthCalledWith(1, step.steps, expect.any(Object), [0]);
    expect(executeFlow).toHaveBeenNthCalledWith(2, step.steps, expect.any(Object), [1]);
    expect(state.output.collector).toEqual({ sum: 2 });
    expect(state.accumulator).toBeUndefined();
  });
});

describe('loop helpers', () => {
  it('updates accumulator and stop conditions based on configuration', async () => {
    const step: LoopStep = {
      id: 'loop',
      kind: 'loop',
      stepInfo: { id: 'loop', name: 'loop', type: 'loop' },
      forEach: { item: 'entry', in: { kind: 'literal', value: [] } },
      steps: [],
    };

    const scope = {
      input: {},
      context: new TestContext().state,
      memory: {},
      output: {},
      iteration: { item: 1, index: 0 },
      accumulator: 5,
    };

    await expect(updateAccumulator(step, scope, 5)).resolves.toBe(5);
    await expect(shouldStopLoop(step, scope)).resolves.toBe(false);
  });
});
