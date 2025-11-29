import { z } from 'zod';

import { Settings } from '../../dsl.types';
import { WorkflowContext } from '../../context';
import { AbstractAction } from '../abstract-action';
import { ActionExecutionArgs, ActionMetadata } from '../action.types';

const InputSchema = z.object({ value: z.number() });
const OutputSchema = z.object({ result: z.number() });

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;

class TestContext extends WorkflowContext {
  constructor() {
    super();
  }
}

class HarnessedAction extends AbstractAction<Input, Output, TestContext> {
  constructor(
    private readonly executor: (
      args: ActionExecutionArgs<Input, TestContext>,
    ) => Promise<Output>,
  ) {
    const metadata: ActionMetadata<Input, Output> = {
      name: 'timing_action',
      description: 'Action used to validate retry and timeout behavior.',
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
    };

    super(metadata);
  }

  execute(args: ActionExecutionArgs<Input, TestContext>): Promise<Output> {
    return this.executor(args);
  }
}

describe('AbstractAction timing and retries', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('fails when execution exceeds the configured timeout', async () => {
    jest.useFakeTimers();
    let attempts = 0;

    const action = new HarnessedAction(async () => {
      attempts += 1;
      await new Promise((resolve) => setTimeout(resolve, 100));
      return { result: 1 };
    });

    const settings: Partial<Settings> = {
      timeout_ms: 50,
      retries: {
        max_attempts: 1,
        backoff_ms: 0,
        max_delay_ms: 0,
        jitter: 0,
        multiplier: 1,
      },
    };

    const runPromise = action.run({ value: 1 }, new TestContext(), settings);
    const runExpectation = expect(runPromise).rejects.toThrow(/timeout of 50ms/);
    await jest.advanceTimersByTimeAsync(60);

    await runExpectation;
    expect(attempts).toBe(1);
  });

  it('applies exponential backoff capped by max_delay_ms', async () => {
    jest.useFakeTimers();

    let attempts = 0;
    const attemptTimestamps: number[] = [];
    const action = new HarnessedAction(async () => {
      attempts += 1;
      attemptTimestamps.push(Date.now());

      if (attempts < 3) {
        throw new Error('Retry me');
      }

      return { result: attempts };
    });

    const runPromise = action.run(
      { value: 1 },
      new TestContext(),
      {
        timeout_ms: 0,
        retries: {
          max_attempts: 3,
          backoff_ms: 10,
          max_delay_ms: 15,
          jitter: 0,
          multiplier: 2,
        },
      },
    );

    await Promise.resolve();
    expect(attempts).toBe(1);

    await jest.advanceTimersByTimeAsync(9);
    expect(attempts).toBe(1);
    await jest.advanceTimersByTimeAsync(1);
    expect(attempts).toBe(2);

    await jest.advanceTimersByTimeAsync(14);
    expect(attempts).toBe(2);
    await jest.advanceTimersByTimeAsync(1);

    await expect(runPromise).resolves.toEqual({ result: 3 });

    expect(attempts).toBe(3);
    expect(attemptTimestamps[1] - attemptTimestamps[0]).toBe(10);
    expect(attemptTimestamps[2] - attemptTimestamps[1]).toBe(15);
  });

  it('uses jitter to randomize retry delays', async () => {
    jest.useFakeTimers();

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(1);
    let attempts = 0;
    const attemptTimestamps: number[] = [];

    const action = new HarnessedAction(async () => {
      attempts += 1;
      attemptTimestamps.push(Date.now());

      if (attempts < 2) {
        throw new Error('Intermittent');
      }

      return { result: attempts };
    });

    const runPromise = action.run(
      { value: 1 },
      new TestContext(),
      {
        timeout_ms: 0,
        retries: {
          max_attempts: 2,
          backoff_ms: 100,
          max_delay_ms: 0,
          jitter: 0.5,
          multiplier: 1,
        },
      },
    );

    await Promise.resolve();
    expect(attempts).toBe(1);

    await jest.advanceTimersByTimeAsync(149);
    expect(attempts).toBe(1);
    await jest.advanceTimersByTimeAsync(1);

    await expect(runPromise).resolves.toEqual({ result: 2 });

    expect(attempts).toBe(2);
    expect(randomSpy).toHaveBeenCalled();
    expect(attemptTimestamps[1] - attemptTimestamps[0]).toBe(150);
  });
});
