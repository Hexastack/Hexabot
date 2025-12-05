import { BaseWorkflowContext } from '../context';
import type { Settings } from '../dsl.types';
import {
  compileValue,
  evaluateMapping,
  evaluateValue,
  mergeSettings,
} from '../workflow-values';

class TestContext extends BaseWorkflowContext {
  constructor(initial?: Record<string, unknown>) {
    super(initial);
  }
}

describe('workflow values', () => {
  it('compiles expressions and evaluates against the runtime scope', async () => {
    const compiled = compileValue(
      '=$input.amount + $memory.offset + $iteration.index + $accumulator',
    );

    const result = await evaluateValue(compiled, {
      input: { amount: 10 },
      context: new TestContext().state,
      memory: { offset: 5 },
      output: {},
      iteration: { item: 'item', index: 2 },
      accumulator: 3,
      result: { value: 7 },
    });

    expect(result).toBe(20);
  });

  it('returns literal values unchanged and evaluates mappings', async () => {
    const literal = compileValue({ raw: true });
    const mapping = {
      literal,
      expression: compileValue('=$result.value'),
    };

    const values = await evaluateMapping(mapping, {
      input: {},
      context: new TestContext().state,
      memory: {},
      output: {},
      result: { value: 42 },
    });

    expect(values).toEqual({
      literal: { raw: true },
      expression: 42,
    });
  });

  it('handles missing mappings and deep merges settings', async () => {
    await expect(
      evaluateMapping(undefined, {
        input: {},
        context: new TestContext().state,
        memory: {},
        output: {},
      }),
    ).resolves.toEqual({});

    const merged = mergeSettings(
      {
        timeout_ms: 10,
        retries: {
          max_attempts: 3,
          backoff_ms: 10,
          max_delay_ms: 100,
          jitter: 0,
          multiplier: 2,
        },
        audit: false,
        guardrails: { mode: 'default' },
      } satisfies Partial<Settings>,
      {
        retries: {
          max_attempts: 5,
          backoff_ms: 10,
          max_delay_ms: 100,
          jitter: 0,
          multiplier: 1,
        },
        audit: true,
        guardrails: { mode: 'strict' },
      },
    );

    expect(merged).toEqual({
      timeout_ms: 10,
      retries: {
        max_attempts: 5,
        backoff_ms: 10,
        max_delay_ms: 100,
        jitter: 0,
        multiplier: 1,
      },
      audit: true,
      guardrails: { mode: 'strict' },
    });
  });
});
