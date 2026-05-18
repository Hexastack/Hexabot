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
  ConditionalStep,
  ExecutionState,
  Suspension,
} from '../workflow-types';

import { executeConditional } from './conditional-executor';
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
const createTaskStep = (id: string): CompiledStep => ({
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
    executeFlow: jest.fn(),
    executeStep: jest.fn(),
    fork: jest.fn(),
  } as StepExecutorEnv;

  env.fork = jest.fn((overrides) => ({ ...env, ...overrides }));

  return env;
};

describe('executeConditional', () => {
  it('executes the first matching branch', async () => {
    const env = createEnv();
    const state = createState();
    const step: ConditionalStep = {
      id: 'conditional',
      type: StepType.Conditional,
      label: 'conditional',
      branches: [
        {
          id: 'branch-0',
          condition: { kind: 'literal', value: false },
          steps: [createTaskStep('a')],
        },
        {
          id: 'branch-1',
          condition: { kind: 'literal', value: true },
          steps: [createTaskStep('b')],
        },
        {
          id: 'branch-2',
          condition: { kind: 'literal', value: true },
          steps: [createTaskStep('c')],
        },
      ],
    };
    env.executeFlow = jest.fn().mockResolvedValue(undefined);

    const result = await executeConditional(env, step, state, [0]);

    expect(result).toBeUndefined();
    expect(env.executeFlow).toHaveBeenCalledTimes(1);
    expect(env.executeFlow).toHaveBeenCalledWith(
      step.branches[1].steps,
      state,
      [0, 'branch', 1],
    );
  });

  it('wraps and resumes from a suspended branch', async () => {
    const env = createEnv();
    const state = createState();
    const innerSuspension: Suspension = {
      step: { id: 'inner', name: 'inner', type: StepType.Task } as StepInfo,
      reason: 'pause',
      continue: jest.fn().mockResolvedValue(undefined),
    };
    env.executeFlow = jest.fn().mockResolvedValue(innerSuspension);

    const step: ConditionalStep = {
      id: 'conditional',
      type: StepType.Conditional,
      label: 'conditional',
      branches: [{ id: 'branch-0', steps: [createTaskStep('a')] }],
    };
    const suspension = await executeConditional(env, step, state, []);
    expect(suspension).toEqual(
      expect.objectContaining({ step: innerSuspension.step, reason: 'pause' }),
    );
    expect(env.executeFlow).toHaveBeenCalledTimes(1);

    await suspension?.continue('resume-data');
    expect(innerSuspension.continue).toHaveBeenCalledWith('resume-data');
    expect(env.executeFlow).toHaveBeenCalledTimes(1);
  });

  it('forwards nested suspensions from branch continuation', async () => {
    const env = createEnv();
    const state = createState();
    const nextSuspension: Suspension = {
      step: { id: 'next', name: 'next', type: StepType.Task } as StepInfo,
      continue: jest.fn(),
    };
    const innerSuspension: Suspension = {
      step: { id: 'inner', name: 'inner', type: StepType.Task } as StepInfo,
      continue: jest.fn().mockResolvedValue(nextSuspension),
    };
    env.executeFlow = jest.fn().mockResolvedValue(innerSuspension);

    const step: ConditionalStep = {
      id: 'conditional',
      type: StepType.Conditional,
      label: 'conditional',
      branches: [{ id: 'branch-0', steps: [createTaskStep('a')] }],
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
      type: StepType.Conditional,
      label: 'conditional',
      branches: [
        {
          id: 'branch-0',
          condition: { kind: 'literal', value: false },
          steps: [createTaskStep('a')],
        },
        {
          id: 'branch-1',
          condition: { kind: 'literal', value: false },
          steps: [createTaskStep('b')],
        },
      ],
    };
    const result = await executeConditional(env, step, state, []);

    expect(result).toBeUndefined();
    expect(env.executeFlow).not.toHaveBeenCalled();
  });
});
