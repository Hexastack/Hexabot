import { z } from 'zod';

import { WorkflowContext } from '../../context';
import {
  DEFAULT_RETRY_SETTINGS,
  DEFAULT_TIMEOUT_MS,
  SettingsSchema,
} from '../../dsl.types';
import { AbstractAction } from '../abstract-action';
import {
    InferActionContext,
    InferActionInput,
    InferActionOutput,
    InferActionSettings,
    type Action,
    type ActionExecutionArgs,
    type ActionMetadata
} from '../action.types';

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
const expectType = <T extends true>(): void => {
  void (0 as unknown as T);
};

class DoubleContext extends WorkflowContext {
  constructor(public factor: number) {
    super();
  }
}

const InputSchema = z.object({ value: z.number() });
const OutputSchema = z.object({ result: z.number() });


class DoubleAction extends AbstractAction<
  z.infer<typeof InputSchema>,
  z.infer<typeof OutputSchema>,
  DoubleContext
> {
  constructor() {
    const metadata: ActionMetadata<z.infer<typeof InputSchema>, z.infer<typeof OutputSchema>> = {
      name: 'double_step',
      description: 'Doubles the incoming value by a context-defined factor.',
      inputSchema: InputSchema,
      outputSchema: OutputSchema
    };

    super(metadata);
  }

  async execute({
    input,
    context
  }: ActionExecutionArgs<z.infer<typeof InputSchema>, DoubleContext>): Promise<z.infer<typeof OutputSchema>> {
    return {
      result: input.value * context.factor * 2
    };
  }
}

const DoubleSettingsSchema = SettingsSchema.extend({
  multiplier: z.number().int().min(1),
});

class ConfigurableDoubleAction extends AbstractAction<
  z.infer<typeof InputSchema>,
  z.infer<typeof OutputSchema>,
  DoubleContext,
  z.infer<typeof DoubleSettingsSchema>
> {
  constructor() {
    const metadata: ActionMetadata<
      z.infer<typeof InputSchema>,
      z.infer<typeof OutputSchema>,
      z.infer<typeof DoubleSettingsSchema>
    > = {
      name: 'configurable_double_step',
      description: 'Doubles the incoming value by configurable multiplier.',
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      settingsSchema: DoubleSettingsSchema,
    };

    super(metadata);
  }

  async execute({
    input,
    context,
    settings,
  }: ActionExecutionArgs<
    z.infer<typeof InputSchema>,
    DoubleContext,
    z.infer<typeof DoubleSettingsSchema>
  >): Promise<z.infer<typeof OutputSchema>> {
    const base = input.value * context.factor * 2;
    const multiplier = settings?.multiplier ?? 1;
    return {
      result: base * multiplier,
    };
  }
}

class FlakyDoubleAction extends DoubleAction {
  public attemptCount = 0;

  constructor() {
    super();
  }

  override async execute({
    input,
    context,
    settings,
  }: ActionExecutionArgs<z.infer<typeof InputSchema>, DoubleContext>): Promise<
    z.infer<typeof OutputSchema>
  > {
    this.attemptCount += 1;
    if (this.attemptCount < 3) {
      throw new Error('Intermittent failure');
    }

    return super.execute({ input, context, settings });
  }
}

describe('workflow step primitives', () => {
  it('applies default action settings from the schema', () => {
    const parsed = SettingsSchema.parse({});

    expect(parsed.timeout_ms).toBe(DEFAULT_TIMEOUT_MS);
    expect(parsed.retries).toEqual(DEFAULT_RETRY_SETTINGS);
    expect(parsed.retries).not.toBe(DEFAULT_RETRY_SETTINGS);
  });

  it('rejects invalid retry configuration via schema validation', () => {
    expect(() =>
      SettingsSchema.parse({ retries: { max_attempts: 0, backoff_ms: 10 } }),
    ).toThrow();
  });

  it('parses input and output while executing run()', async () => {
    const step = new DoubleAction();
    const context = new DoubleContext(3);

    const output = await step.run({ value: 2 }, context, {});

    expect(output).toEqual({ result: 12 });
  });

  it('parses settings using the configured schema before execution', async () => {
    const step = new ConfigurableDoubleAction();
    const context = new DoubleContext(3);

    await expect(
      step.run({ value: 2 }, context, { multiplier: 2 }),
    ).resolves.toEqual({ result: 24 });
    await expect(
      step.run({ value: 2 }, context, { multiplier: 1 }),
    ).resolves.toEqual({ result: 12 });
    await expect(
      step.run({ value: 2 }, context, { multiplier: 0 }),
    ).rejects.toThrow();
  });

  it('exposes accurate compile-time types', () => {
    type ActionType = Action<
      InferActionInput<DoubleAction>,
      InferActionOutput<DoubleAction>,
      InferActionContext<DoubleAction>
    >;

    expectType<Equal<InferActionInput<DoubleAction>, { value: number }>>();
    expectType<Equal<InferActionOutput<DoubleAction>, { result: number }>>();
    expectType<Equal<InferActionContext<DoubleAction>, DoubleContext>>();
    expectType<
      Equal<
        InferActionSettings<ConfigurableDoubleAction>,
        z.infer<typeof DoubleSettingsSchema>
      >
    >();

    const step: ActionType = new DoubleAction();
    expect(step.name).toBe('double_step');
  });

  it('retries failing steps using exponential backoff', async () => {
    jest.useFakeTimers();
    try {
      const step = new FlakyDoubleAction();

      const context = new DoubleContext(2);
      const runPromise = step.run({ value: 1 }, context, {});

      // First attempt happens immediately and fails
      await Promise.resolve();
      expect(step.attemptCount).toBe(1);

      // Advance to trigger second attempt
      await jest.advanceTimersByTimeAsync(25);
      await Promise.resolve();
      expect(step.attemptCount).toBe(2);

      // Advance to trigger third attempt which should succeed
      await jest.advanceTimersByTimeAsync(25);
      await Promise.resolve();

      await expect(runPromise).resolves.toEqual({ result: 4 });
      expect(step.attemptCount).toBe(3);
    } finally {
      jest.useRealTimers();
    }
  });
});
