/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseWorkflowContext } from '../context';
import { ParallelSuspensionError } from '../errors';
import type { RuntimeSuspensionRequest } from '../runner-runtime-control';
import {
  StepType,
  type EventEmitterLike,
  type StepInfo,
} from '../workflow-event-emitter';
import type {
  CompiledStep,
  ExecutionState,
  ParallelStep,
  Suspension,
} from '../workflow-types';

import { executeParallel } from './parallel-executor';
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
const createChild = (id: string): CompiledStep => ({
  id,
  type: StepType.Task,
  label: id,
  taskName: `task_${id}`,
});
const createEnv = (): StepExecutorEnv => {
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
    runId: 'run-1',
    buildInstanceStepInfo: jest.fn((step: CompiledStep): StepInfo => {
      return { id: step.id, name: step.label, type: step.type };
    }),
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
    executeFlow: jest.fn(),
    executeStep: jest.fn(),
    fork: jest.fn(),
  } as StepExecutorEnv;

  env.fork = jest.fn((overrides) => {
    const forked = { ...env, ...overrides } as StepExecutorEnv;

    forked.executeStep = jest.fn((step, state, path) =>
      (env.executeStep as jest.Mock)(step, state, path, forked.signal),
    );
    forked.executeFlow = jest.fn((steps, state, path, startIndex) =>
      (env.executeFlow as jest.Mock)(
        steps,
        state,
        path,
        startIndex,
        forked.signal,
      ),
    );

    return forked;
  });

  return env;
};
const createStep = (strategy: ParallelStep['strategy']): ParallelStep => ({
  id: 'parallel',
  type: StepType.Parallel,
  label: 'parallel',
  strategy,
  steps: [createChild('a'), createChild('b')],
});
const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('executeParallel', () => {
  it('starts all children before waiting when using wait_all', async () => {
    const env = createEnv();
    const state = createState();
    const step = createStep('wait_all');
    const started: string[] = [];
    const resolvers: Array<() => void> = [];

    env.executeStep = jest.fn((child: CompiledStep) => {
      started.push(child.id);

      return new Promise<void>((resolve) => {
        resolvers.push(resolve);
      });
    });

    const resultPromise = executeParallel(env, step, state, [0]);
    await flushPromises();

    expect(started).toEqual(['a', 'b']);
    expect(env.executeStep).toHaveBeenCalledTimes(2);

    resolvers.forEach((resolve) => resolve());
    await expect(resultPromise).resolves.toBeUndefined();
  });

  it('merges wait_all output deltas in child-index order', async () => {
    const env = createEnv();
    const state = createState();
    const step = createStep('wait_all');

    state.output.existing = 'keep';
    env.executeStep = jest.fn(
      async (child: CompiledStep, branchState: ExecutionState) => {
        branchState.output.shared = child.id;
        branchState.output[`${child.id}_only`] = true;
      },
    );

    await executeParallel(env, step, state, []);

    expect(state.output).toEqual({
      existing: 'keep',
      shared: 'b',
      a_only: true,
      b_only: true,
    });
  });

  it('fails wait_all fast and aborts unfinished siblings', async () => {
    const env = createEnv();
    const state = createState();
    const step = createStep('wait_all');
    const failure = new Error('branch failed');

    env.executeStep = jest.fn(
      (
        child: CompiledStep,
        _branchState: ExecutionState,
        _path: Array<number | string>,
        signal?: AbortSignal,
      ) => {
        if (child.id === 'a') {
          return Promise.reject(failure);
        }

        return new Promise<void>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        });
      },
    );

    await expect(executeParallel(env, step, state, [])).rejects.toThrow(
      'branch failed',
    );
    expect(env.markSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'b' }),
      'cancelled',
      'branch failed',
    );
  });

  it('wait_any starts every child, keeps only the winner output, and cancels losers', async () => {
    const env = createEnv();
    const state = createState();
    const step = createStep('wait_any');
    const started: string[] = [];

    env.executeStep = jest.fn(
      async (
        child: CompiledStep,
        branchState: ExecutionState,
        _path: Array<number | string>,
        signal?: AbortSignal,
      ) => {
        started.push(child.id);
        if (child.id === 'b') {
          branchState.output.winner = child.id;

          return undefined;
        }

        return new Promise<void>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        });
      },
    );

    await executeParallel(env, step, state, []);

    expect(started).toEqual(['a', 'b']);
    expect(state.output).toEqual({ winner: 'b' });
    expect(env.markSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'a' }),
      'cancelled',
      'Parallel wait_any winner selected.',
    );
  });

  it('wait_any fails fast before any successful winner', async () => {
    const env = createEnv();
    const state = createState();
    const step = createStep('wait_any');

    env.executeStep = jest.fn(
      (
        child: CompiledStep,
        branchState: ExecutionState,
        _path: Array<number | string>,
        signal?: AbortSignal,
      ) => {
        if (child.id === 'a') {
          return Promise.reject(new Error('no winner'));
        }

        branchState.output.loser = true;

        return new Promise<void>((_resolve, reject) => {
          signal?.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        });
      },
    );

    await expect(executeParallel(env, step, state, [])).rejects.toThrow(
      'no winner',
    );
    expect(state.output).toEqual({});
    expect(env.markSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'b' }),
      'cancelled',
      'no winner',
    );
  });

  it('rejects suspensions returned by children', async () => {
    const env = createEnv();
    const state = createState();
    const step = createStep('wait_all');
    const innerSuspension: Suspension = {
      step: { id: 'a', name: 'a', type: StepType.Task } as StepInfo,
      continue: jest.fn().mockResolvedValue(undefined),
    };

    env.executeStep = jest.fn((child: CompiledStep) => {
      if (child.id === 'a') {
        return Promise.resolve(innerSuspension);
      }

      return Promise.resolve(undefined);
    });

    await expect(executeParallel(env, step, state, [])).rejects.toBeInstanceOf(
      ParallelSuspensionError,
    );
  });
});
