/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import type {
  BindingKindSchemas,
  InferWorkflowBindings,
  MountedBindingPayload,
} from '../../bindings/base-binding';
import { BaseWorkflowContext } from '../../context';
import { Settings, SettingsSchema } from '../../dsl.types';
import { EventEmitterLike } from '../../workflow-event-emitter';
import { AbstractAction } from '../abstract-action';
import {
  InferActionBindings,
  InferActionContext,
  InferActionInput,
  InferActionOutput,
  InferActionSettings,
  type Action,
  type ActionExecutionArgs,
  type ActionMetadata,
} from '../action.types';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
const expectType = <T extends true>(): void => {
  void (0 as unknown as T);
};

class DoubleContext extends BaseWorkflowContext<{ factor: number }> {
  public eventEmitter: EventEmitterLike = { emit: jest.fn(), on: jest.fn() };
}

const InputSchema = z.object({ value: z.number() });
const OutputSchema = z.object({ result: z.number() });
const NoSettingsSchema = z.any();
const _bindingKindSchemas = {
  tools: {
    schema: z.record(z.string(), z.unknown()),
    multiple: true,
    actionPolicy: 'required',
  },
  model: {
    schema: z.strictObject({
      provider: z.string(),
      model_id: z.string(),
    }),
    multiple: false,
  },
} as const satisfies BindingKindSchemas;
type TestBindings = InferWorkflowBindings<typeof _bindingKindSchemas>;

class DoubleAction extends AbstractAction<
  z.infer<typeof InputSchema>,
  z.infer<typeof OutputSchema>,
  DoubleContext,
  unknown
> {
  constructor() {
    const metadata: ActionMetadata<
      z.infer<typeof InputSchema>,
      z.infer<typeof OutputSchema>,
      unknown
    > = {
      name: 'double_step',
      description: 'Doubles the incoming value by a context-defined factor.',
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      settingsSchema: NoSettingsSchema,
    };

    super(metadata);
  }

  async execute({
    input,
    context,
  }: ActionExecutionArgs<
    z.infer<typeof InputSchema>,
    DoubleContext,
    unknown
  >): Promise<z.infer<typeof OutputSchema>> {
    return {
      result: input.value * context.state.factor * 2,
    };
  }
}

const DoubleSettingsSchema = z.strictObject({
  multiplier: z.int().min(1),
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
    const base = input.value * context.state.factor * 2;
    const multiplier = settings?.multiplier ?? 1;

    return {
      result: base * multiplier,
    };
  }
}

const InvalidSettingsSchema = z.strictObject({
  timeout_ms: z.int().positive().max(5_000),
});

class InvalidSettingsAction extends AbstractAction<
  z.infer<typeof InputSchema>,
  z.infer<typeof OutputSchema>,
  DoubleContext,
  z.infer<typeof InvalidSettingsSchema>
> {
  constructor() {
    const metadata: ActionMetadata<
      z.infer<typeof InputSchema>,
      z.infer<typeof OutputSchema>,
      z.infer<typeof InvalidSettingsSchema>
    > = {
      name: 'invalid_settings_step',
      description: 'Invalid action that redefines base settings keys.',
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      settingsSchema: InvalidSettingsSchema,
    };

    super(metadata);
  }

  async execute({
    input,
    context,
  }: ActionExecutionArgs<
    z.infer<typeof InputSchema>,
    DoubleContext,
    z.infer<typeof InvalidSettingsSchema>
  >): Promise<z.infer<typeof OutputSchema>> {
    return {
      result: input.value * context.state.factor * 2,
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
    bindings,
    signal,
  }: ActionExecutionArgs<
    z.infer<typeof InputSchema>,
    DoubleContext,
    unknown
  >): Promise<z.infer<typeof OutputSchema>> {
    this.attemptCount += 1;
    if (this.attemptCount < 3) {
      throw new Error('Intermittent failure');
    }

    return super.execute({ input, context, settings, bindings, signal });
  }
}

class BindingsAwareAction extends AbstractAction<
  z.infer<typeof InputSchema>,
  z.infer<typeof OutputSchema>,
  DoubleContext,
  unknown,
  TestBindings
> {
  constructor() {
    const metadata: ActionMetadata<
      z.infer<typeof InputSchema>,
      z.infer<typeof OutputSchema>,
      unknown
    > = {
      name: 'bindings_aware_step',
      description: 'Reads workflow bindings.',
      inputSchema: InputSchema,
      outputSchema: OutputSchema,
      settingsSchema: NoSettingsSchema,
      supportedBindings: ['tools'],
    };

    super(metadata);
  }

  async execute({
    input,
  }: ActionExecutionArgs<
    z.infer<typeof InputSchema>,
    DoubleContext,
    unknown,
    TestBindings
  >): Promise<z.infer<typeof OutputSchema>> {
    return {
      result: input.value,
    };
  }
}

describe('workflow step primitives', () => {
  it('rejects invalid retry configuration via schema validation', () => {
    expect(() =>
      SettingsSchema.parse({ retries: { max_attempts: 0, backoff_ms: 10 } }),
    ).toThrow();
  });

  it('parses input and output while executing run()', async () => {
    const step = new DoubleAction();
    const context = new DoubleContext({ factor: 3 });
    const output = await step.run({ value: 2 }, context, {});

    expect(output).toEqual({ result: 12 });
  });

  it('parses settings using the configured schema before execution', async () => {
    const step = new ConfigurableDoubleAction();
    const context = new DoubleContext({ factor: 3 });

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

  it('rejects run() bindings when the action does not support their kind', async () => {
    const step = new DoubleAction();
    const context = new DoubleContext({ factor: 3 });

    await expect(
      step.run({ value: 2 }, context, {}, {
        tools: {
          calculate: {
            action: 'calculate_score',
            settings: {},
          },
        },
      } as any),
    ).rejects.toThrow('does not support binding kind(s): tools');
  });

  it('accepts run() bindings when the action declares the binding kind', async () => {
    const step = new BindingsAwareAction();
    const context = new DoubleContext({ factor: 3 });

    await expect(
      step.run(
        { value: 2 },
        context,
        {},
        {
          tools: {
            calculate: {
              action: 'calculate_score',
              settings: {},
            },
          },
        },
      ),
    ).resolves.toEqual({ result: 2 });
  });

  it('accepts base settings without requiring action schemas to extend them', async () => {
    const step = new ConfigurableDoubleAction();
    const context = new DoubleContext({ factor: 3 });

    await expect(
      step.run({ value: 2 }, context, {
        multiplier: 2,
        timeout_ms: 10,
        retries: {
          enabled: false,
          max_attempts: 3,
          backoff_ms: 25,
          max_delay_ms: 1_000,
          jitter: 0,
          multiplier: 1,
        },
      }),
    ).resolves.toEqual({ result: 24 });

    expect(() => step.settingSchema.parse({ multiplier: 2 })).not.toThrow();
    expect(() =>
      step.settingSchema.parse({
        multiplier: 2,
        retries: {
          enabled: false,
          max_attempts: 3,
          backoff_ms: 25,
          max_delay_ms: 1_000,
          jitter: 0,
          multiplier: 1,
        },
      }),
    ).toThrow();
  });

  it('rejects action schemas that redefine base setting keys', () => {
    expect(() => new InvalidSettingsAction()).toThrow(
      'settingsSchema cannot redefine base settings keys: timeout_ms',
    );
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
        Settings & z.infer<typeof DoubleSettingsSchema>
      >
    >();
    expectType<Equal<InferActionBindings<BindingsAwareAction>, TestBindings>>();
    expectType<
      Equal<
        NonNullable<TestBindings['tools']>,
        Record<
          string,
          MountedBindingPayload<
            typeof _bindingKindSchemas.tools,
            typeof _bindingKindSchemas
          >
        >
      >
    >();
    expectType<
      Equal<
        NonNullable<TestBindings['model']>,
        MountedBindingPayload<
          typeof _bindingKindSchemas.model,
          typeof _bindingKindSchemas
        >
      >
    >();
    type NestedToolBindings = NonNullable<
      NonNullable<TestBindings['tools']>[string]['bindings']
    >;
    expectType<
      Equal<
        NonNullable<NestedToolBindings['model']>,
        MountedBindingPayload<
          typeof _bindingKindSchemas.model,
          typeof _bindingKindSchemas
        >
      >
    >();
    expectType<
      Equal<
        NonNullable<NestedToolBindings['tools']>,
        Record<
          string,
          MountedBindingPayload<
            typeof _bindingKindSchemas.tools,
            typeof _bindingKindSchemas
          >
        >
      >
    >();

    const step: ActionType = new DoubleAction();
    expect(step.name).toBe('double_step');
  });

  it('retries failing steps using exponential backoff', async () => {
    jest.useFakeTimers();
    try {
      const step = new FlakyDoubleAction();
      const context = new DoubleContext({ factor: 2 });
      const runPromise = step.run({ value: 1 }, context, {
        retries: {
          enabled: true,
          max_attempts: 3,
          backoff_ms: 25,
          max_delay_ms: 10_000,
          jitter: 0,
          multiplier: 1,
        },
      });

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

  it('does not retry when retries are disabled', async () => {
    const step = new FlakyDoubleAction();
    const context = new DoubleContext({ factor: 2 });

    await expect(
      step.run({ value: 1 }, context, {
        retries: {
          enabled: false,
          max_attempts: 5,
          backoff_ms: 25,
          max_delay_ms: 1_000,
          jitter: 0,
          multiplier: 2,
        },
      }),
    ).rejects.toThrow('Intermittent failure');
    expect(step.attemptCount).toBe(1);
  });
});
