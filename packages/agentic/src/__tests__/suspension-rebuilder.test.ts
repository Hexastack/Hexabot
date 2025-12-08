/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import type { Action } from '../action/action.types';
import { BaseWorkflowContext } from '../context';
import type {
  Settings,
  TaskDefinition,
  WorkflowDefinition,
} from '../dsl.types';
import {
  executeLoop as runLoopExecutor,
  shouldStopLoop,
  updateAccumulator,
} from '../step-executors/loop-executor';
import { executeParallel as runParallelExecutor } from '../step-executors/parallel-executor';
import type { StepExecutorEnv } from '../step-executors/types';
import {
  parseSuspendedStepId,
  rebuildSuspension,
  type SuspensionRebuilderDeps,
} from '../suspension-rebuilder';
import { EventEmitterLike } from '../workflow-event-emitter';
import type {
  CompiledStep,
  CompiledTask,
  CompiledWorkflow,
  ExecutionState,
} from '../workflow-types';

jest.mock('../step-executors/loop-executor', () => ({
  __esModule: true,
  executeLoop: jest.fn(),
  updateAccumulator: jest.fn(),
  shouldStopLoop: jest.fn(),
}));

jest.mock('../step-executors/parallel-executor', () => ({
  __esModule: true,
  executeParallel: jest.fn(),
}));

const mockedRunLoopExecutor = runLoopExecutor as jest.MockedFunction<
  typeof runLoopExecutor
>;
const mockedUpdateAccumulator = updateAccumulator as jest.MockedFunction<
  typeof updateAccumulator
>;
const mockedShouldStopLoop = shouldStopLoop as jest.MockedFunction<
  typeof shouldStopLoop
>;
const mockedRunParallelExecutor = runParallelExecutor as jest.MockedFunction<
  typeof runParallelExecutor
>;

class TestContext extends BaseWorkflowContext {
  public eventEmitter: EventEmitterLike = { emit: jest.fn(), on: jest.fn() };

  constructor(initial: Record<string, unknown>) {
    super(initial);
  }
}

const dummyAction: Action<unknown, unknown, BaseWorkflowContext, Settings> = {
  name: 'dummy',
  description: 'dummy',
  inputSchema: z.any(),
  outputSchema: z.any(),
  execute: jest.fn(),
  parseInput: (value) => value as unknown,
  parseOutput: (value) => value as unknown,
  parseSettings: (value) => value as Settings,
  run: jest.fn(),
};
const buildStepInfo = (step: CompiledStep, iterationStack: number[]) => ({
  ...step.stepInfo,
  id: `${step.stepInfo.id}${
    iterationStack.length > 0 ? `[${iterationStack.join('.')}]` : ''
  }`,
});
const createCompiledWorkflow = (
  flow: CompiledStep[],
  tasks: Record<string, CompiledTask>,
): CompiledWorkflow =>
  ({
    definition: {} as WorkflowDefinition,
    tasks,
    flow,
    outputMapping: {},
    inputParser: { parse: (value: unknown) => value },
  }) as CompiledWorkflow;
const createDeps = (
  compiled: CompiledWorkflow,
  overrides?: Partial<SuspensionRebuilderDeps>,
): SuspensionRebuilderDeps => {
  const context = overrides?.context ?? new TestContext({});
  const captureTaskOutput =
    overrides?.captureTaskOutput ?? jest.fn().mockResolvedValue(undefined);
  const markSnapshot =
    overrides?.markSnapshot ??
    (jest.fn() as SuspensionRebuilderDeps['markSnapshot']);
  const emit =
    overrides?.emit ?? (jest.fn() as SuspensionRebuilderDeps['emit']);
  const executeFlow =
    overrides?.executeFlow ??
    (jest
      .fn()
      .mockResolvedValue(undefined) as SuspensionRebuilderDeps['executeFlow']);
  const deps: SuspensionRebuilderDeps = {
    compiled,
    context,
    runId: overrides?.runId ?? 'run-123',
    createExecutorEnv:
      overrides?.createExecutorEnv ??
      jest.fn(
        () =>
          ({
            context,
          }) as unknown as StepExecutorEnv,
      ),
    buildInstanceStepInfo: overrides?.buildInstanceStepInfo ?? buildStepInfo,
    captureTaskOutput,
    markSnapshot,
    emit,
    executeFlow,
  };

  return deps;
};
const createTask = (name: string): CompiledTask =>
  ({
    name,
    definition: { action: name } as TaskDefinition,
    actionName: name,
    action: dummyAction,
    inputs: {},
    outputs: {},
    settings: {} as Settings,
  }) as CompiledTask;

afterEach(() => {
  jest.clearAllMocks();
});

describe('parseSuspendedStepId', () => {
  it('extracts path and iteration stack from a nested id', () => {
    expect(parseSuspendedStepId('1.branch.0:conditional[2.4]')).toEqual({
      path: [1, 'branch', 0],
      iterationStack: [2, 4],
    });
  });

  it('returns empty path and iteration data for root ids', () => {
    expect(parseSuspendedStepId('root:task')).toEqual({
      path: [],
      iterationStack: [],
    });
  });
});

describe('rebuildSuspension', () => {
  it('returns null when no state is available', () => {
    const compiled = createCompiledWorkflow([], {});
    const deps = createDeps(compiled);
    const suspension = rebuildSuspension(deps, {
      state: undefined,
      stepId: '0:task',
    });

    expect(suspension).toBeNull();
  });

  it('rebuilds a do-step suspension and resumes the flow', async () => {
    const task = createTask('first_task');
    const doStep: CompiledStep = {
      kind: 'do',
      id: '0:do:first_task',
      stepInfo: { id: '0:first_task', name: 'first_task', type: 'task' },
      taskName: 'first_task',
    };
    const compiled = createCompiledWorkflow([doStep], {
      first_task: task,
    });
    const state: ExecutionState = {
      input: {},
      memory: {},
      output: {},
      iterationStack: [3],
    };
    const deps = createDeps(compiled);
    const suspension = rebuildSuspension(deps, {
      state,
      stepId: '0:first_task',
      reason: 'needs_input',
      data: { foo: 'bar' },
    });

    expect(suspension?.step.id).toBe('0:first_task[3]');
    expect(suspension?.reason).toBe('needs_input');
    expect(suspension?.data).toEqual({ foo: 'bar' });

    await suspension?.continue({ reply: 'ok' });

    expect(deps.captureTaskOutput).toHaveBeenCalledWith(task, state, {
      reply: 'ok',
    });
    expect(deps.markSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ id: '0:first_task[3]' }),
      'completed',
    );
    expect(deps.emit).toHaveBeenCalledWith('hook:step:success', {
      runId: 'run-123',
      step: expect.objectContaining({ id: '0:first_task[3]' }),
    });
    expect(deps.executeFlow).toHaveBeenCalledWith(compiled.flow, state, [], 1);
  });

  it('rebuilds a parallel suspension and continues remaining siblings when needed', async () => {
    const firstTask = createTask('child_a');
    const secondTask = createTask('child_b');
    const childA: CompiledStep = {
      kind: 'do',
      id: '0.parallel.0:child_a',
      stepInfo: { id: '0.parallel.0:child_a', name: 'child_a', type: 'task' },
      taskName: 'child_a',
    };
    const childB: CompiledStep = {
      kind: 'do',
      id: '0.parallel.1:child_b',
      stepInfo: { id: '0.parallel.1:child_b', name: 'child_b', type: 'task' },
      taskName: 'child_b',
    };
    const parallelStep: CompiledStep = {
      kind: 'parallel',
      id: '0:parallel',
      stepInfo: { id: '0:parallel', name: 'parallel', type: 'parallel' },
      strategy: 'wait_all',
      steps: [childA, childB],
    };
    const compiled = createCompiledWorkflow([parallelStep], {
      child_a: firstTask,
      child_b: secondTask,
    });
    const state: ExecutionState = {
      input: {},
      memory: {},
      output: {},
      iterationStack: [],
    };
    const deps = createDeps(compiled);

    deps.executeFlow = jest
      .fn()
      .mockResolvedValue(undefined) as SuspensionRebuilderDeps['executeFlow'];
    const suspension = rebuildSuspension(deps, {
      state,
      stepId: '0.parallel.1:child_b',
    });

    mockedRunParallelExecutor.mockResolvedValue(
      'next-suspension' as unknown as void,
    );

    const result = await suspension?.continue({ payload: true });

    expect(deps.captureTaskOutput).toHaveBeenCalledWith(secondTask, state, {
      payload: true,
    });
    expect(mockedRunParallelExecutor).toHaveBeenCalledWith(
      expect.anything(),
      parallelStep,
      state,
      [0],
      2,
    );
    expect(result).toBe('next-suspension');
  });

  it('resumes a loop suspension, updating accumulators and continuing execution', async () => {
    const loopTask = createTask('loop_task');
    const childDo: CompiledStep = {
      kind: 'do',
      id: '0.collector.0:loop_task',
      stepInfo: {
        id: '0.collector.0:loop_task',
        name: 'loop_task',
        type: 'task',
      },
      taskName: 'loop_task',
    };
    const loopStep: CompiledStep = {
      kind: 'loop',
      id: '0:collector',
      stepInfo: { id: '0:collector', name: 'collector', type: 'loop' },
      name: 'collector',
      forEach: { item: 'entry', in: { kind: 'literal', value: [] } },
      steps: [childDo],
      accumulate: {
        as: 'sum',
        initial: 0,
        merge: { kind: 'literal', value: 0 },
      },
    };
    const compiled = createCompiledWorkflow([loopStep], {
      loop_task: loopTask,
    });
    const state: ExecutionState = {
      input: {},
      memory: {},
      output: {},
      iterationStack: [1],
      accumulator: 2,
    };
    const deps = createDeps(compiled);

    deps.executeFlow = jest
      .fn()
      .mockResolvedValue(undefined) as SuspensionRebuilderDeps['executeFlow'];

    mockedUpdateAccumulator.mockResolvedValue(5);
    mockedShouldStopLoop.mockResolvedValue(false);
    mockedRunLoopExecutor.mockResolvedValue(
      'loop-continued' as unknown as void,
    );

    const suspension = rebuildSuspension(deps, {
      state,
      stepId: '0.collector.0:loop_task[1]',
    });
    const result = await suspension?.continue({ resumed: true });

    expect(deps.captureTaskOutput).toHaveBeenCalledWith(
      loopTask,
      expect.objectContaining({ iteration: { index: 1, item: undefined } }),
      { resumed: true },
    );
    expect(mockedUpdateAccumulator).toHaveBeenCalledWith(
      loopStep,
      expect.objectContaining({
        iteration: { item: undefined, index: 1 },
        accumulator: 2,
      }),
      2,
    );
    expect(mockedShouldStopLoop).toHaveBeenCalled();
    expect((state.output as { collector: { sum: number } }).collector.sum).toBe(
      5,
    );
    expect(mockedRunLoopExecutor).toHaveBeenCalledWith(
      expect.anything(),
      loopStep,
      expect.objectContaining({ accumulator: 5, iterationStack: [] }),
      [0],
      2,
    );
    const loopState = mockedRunLoopExecutor.mock.calls[0]?.[2];
    expect(loopState?.accumulator).toBe(5);
    expect(loopState?.iterationStack).toEqual([]);
    expect(result).toBe('loop-continued');
  });
});
