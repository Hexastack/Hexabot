/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseWorkflowContext } from '../context';
import type { RuntimeSuspensionRequest } from '../runner-runtime-control';
import {
  StepType,
  type EventEmitterLike,
  type StepInfo,
} from '../workflow-event-emitter';
import type {
  CompiledStep,
  ExecutionState,
  LoopStep,
  Suspension,
} from '../workflow-types';
import { compileValue } from '../workflow-values';

import {
  executeLoop,
  shouldStopLoop,
  updateAccumulator,
} from './loop-executor';
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
const createEnv = (executeFlow: jest.Mock): StepExecutorEnv => {
  const compiled = {
    definition: {} as any,
    tasks: {},
    flow: [],
    outputMapping: {},
    inputParser: { parse: (value: unknown) => value } as any,
  } as any;
  const env = {
    compiled,
    context: new TestContext(),
    signal: new AbortController().signal,
    runId: 'run-loop',
    buildInstanceStepInfo: jest.fn(),
    markSnapshot: jest.fn(),
    recordStepExecution: jest.fn(),
    emit: jest.fn(),
    setCurrentStep: jest.fn(),
    waitForStepSuspension: jest
      .fn()
      .mockImplementation(
        () => new Promise<RuntimeSuspensionRequest>(() => undefined),
      ),
    clearStepSuspensions: jest.fn(),
    primeStepResumeData: jest.fn(),
    captureTaskOutput: jest.fn(),
    executeFlow,
    executeStep: jest.fn(),
    fork: jest.fn(),
  } as StepExecutorEnv;

  env.fork = jest.fn((overrides) => ({ ...env, ...overrides }));

  return env;
};
const createTaskStep = (id: string): CompiledStep => ({
  id,
  type: StepType.Task,
  label: id,
  taskName: `task_${id}`,
});

describe('executeLoop', () => {
  it('iterates items, accumulates values, and stops when the until condition is met', async () => {
    const flowCalls: Array<{ index: number; item: unknown }> = [];
    const executeFlow = jest.fn(
      async (_steps: CompiledStep[], iterationState: ExecutionState) => {
        flowCalls.push(
          iterationState.iteration as { index: number; item: unknown },
        );
        iterationState.output[`item_${iterationState.iteration?.index}`] =
          iterationState.iteration?.item;

        return undefined;
      },
    );
    const env = createEnv(executeFlow);
    const state = createState();
    const step: LoopStep = {
      id: 'loop',
      type: StepType.Loop,
      loopType: 'for_each',
      label: 'loop',
      name: 'collector',
      forEach: { item: 'entry', in: { kind: 'literal', value: [2, 4, 6] } },
      until: compileValue('=$accumulator >= 6'),
      accumulate: {
        as: 'sum',
        initial: 0,
        merge: compileValue('=$accumulator + $iteration.item'),
      },
      steps: [createTaskStep('child')],
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
      step: { id: 'child', name: 'child', type: StepType.Task } as StepInfo,
      continue: jest.fn().mockResolvedValue(undefined),
    };
    const executeFlow = jest
      .fn()
      .mockResolvedValueOnce(innerSuspension)
      .mockImplementationOnce(
        async (_steps: CompiledStep[], iterationState: ExecutionState) => {
          iterationState.output[`item_${iterationState.iteration?.index}`] =
            iterationState.iteration?.item;

          return undefined;
        },
      );
    const env = createEnv(executeFlow);
    const state = createState();
    const step: LoopStep = {
      id: 'loop',
      type: StepType.Loop,
      loopType: 'for_each',
      label: 'loop',
      name: 'collector',
      forEach: { item: 'entry', in: { kind: 'literal', value: [1, 2] } },
      until: compileValue('=$iteration.index >= 1'),
      accumulate: {
        as: 'sum',
        initial: 0,
        merge: compileValue('=$accumulator + $iteration.item'),
      },
      steps: [createTaskStep('child')],
    };
    const suspension = await executeLoop(env, step, state, []);
    expect(suspension).toEqual(
      expect.objectContaining({ step: innerSuspension.step }),
    );

    const result = await suspension?.continue({ resumed: true });

    expect(result).toBeUndefined();
    expect(innerSuspension.continue).toHaveBeenCalledWith({ resumed: true });
    expect(executeFlow).toHaveBeenCalledTimes(2);
    expect(executeFlow).toHaveBeenNthCalledWith(
      1,
      step.steps,
      expect.any(Object),
      [0],
    );
    expect(executeFlow).toHaveBeenNthCalledWith(
      2,
      step.steps,
      expect.any(Object),
      [1],
    );
    expect(state.output.collector).toEqual({ sum: 2 });
    expect(state.accumulator).toBeUndefined();
  });

  it('evaluates while loops before each iteration and can exit without running', async () => {
    const executeFlow = jest.fn();
    const env = createEnv(executeFlow);
    const state = createState();
    const step: LoopStep = {
      id: 'loop',
      type: StepType.Loop,
      loopType: 'while',
      label: 'loop',
      while: compileValue('=$exists($output.await_phone_reply) = true'),
      steps: [createTaskStep('child')],
    };
    const result = await executeLoop(env, step, state, []);

    expect(result).toBeUndefined();
    expect(executeFlow).not.toHaveBeenCalled();
  });

  it('continues while loops after suspension until the condition becomes false', async () => {
    const innerSuspension: Suspension = {
      step: { id: 'child', name: 'child', type: StepType.Task } as StepInfo,
      continue: jest.fn().mockResolvedValue(undefined),
    };
    const executeFlow = jest
      .fn()
      .mockResolvedValueOnce(innerSuspension)
      .mockImplementationOnce(
        async (_steps: CompiledStep[], iterationState: ExecutionState) => {
          iterationState.output.should_continue = false;
          iterationState.output.done = true;

          return undefined;
        },
      );
    const env = createEnv(executeFlow);
    const state = createState();
    state.output.should_continue = true;

    const step: LoopStep = {
      id: 'loop',
      type: StepType.Loop,
      loopType: 'while',
      label: 'loop',
      name: 'collector',
      while: compileValue(
        '=$exists($output.should_continue) and $output.should_continue = true',
      ),
      accumulate: {
        as: 'count',
        initial: 0,
        merge: compileValue('=$accumulator + 1'),
      },
      steps: [createTaskStep('child')],
    };
    const suspension = await executeLoop(env, step, state, []);
    expect(suspension).toEqual(
      expect.objectContaining({ step: innerSuspension.step }),
    );

    const result = await suspension?.continue({ resumed: true });

    expect(result).toBeUndefined();
    expect(innerSuspension.continue).toHaveBeenCalledWith({ resumed: true });
    expect(executeFlow).toHaveBeenCalledTimes(2);
    expect(executeFlow).toHaveBeenNthCalledWith(
      1,
      step.steps,
      expect.any(Object),
      [0],
    );
    expect(executeFlow).toHaveBeenNthCalledWith(
      2,
      step.steps,
      expect.any(Object),
      [1],
    );
    expect(state.output.collector).toEqual({ count: 1 });
  });
});

describe('loop helpers', () => {
  it('updates accumulator and stop conditions based on configuration', async () => {
    const step: LoopStep = {
      id: 'loop',
      type: StepType.Loop,
      loopType: 'for_each',
      label: 'loop',
      forEach: { item: 'entry', in: { kind: 'literal', value: [] } },
      steps: [],
    };
    const scope = {
      input: {},
      context: new TestContext().state,
      output: {},
      iteration: { item: 1, index: 0 },
      accumulator: 5,
    };

    await expect(updateAccumulator(step, scope, 5)).resolves.toBe(5);
    await expect(shouldStopLoop(step, scope)).resolves.toBe(false);
  });

  it('does not stop while loops through until semantics', async () => {
    const step: LoopStep = {
      id: 'loop',
      type: StepType.Loop,
      loopType: 'while',
      label: 'loop',
      while: compileValue('=true'),
      steps: [],
    };
    const scope = {
      input: {},
      context: new TestContext().state,
      output: {},
      iteration: { item: undefined, index: 0 },
      accumulator: 0,
    };

    await expect(shouldStopLoop(step, scope)).resolves.toBe(false);
  });
});
