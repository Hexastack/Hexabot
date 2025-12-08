/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import type { Action } from '../action/action.types';
import { BaseWorkflowContext } from '../context';
import type { Settings, WorkflowDefinition } from '../dsl.types';
import { compileWorkflow } from '../workflow-compiler';
import { EventEmitterLike } from '../workflow-event-emitter';

class TestContext extends BaseWorkflowContext {
  public eventEmitter: EventEmitterLike = { emit: jest.fn(), on: jest.fn() };
}

const baseRetries = {
  max_attempts: 3,
  backoff_ms: 10,
  max_delay_ms: 100,
  jitter: 0,
  multiplier: 2,
};
const createAction = (
  overrides: Partial<
    Action<unknown, unknown, BaseWorkflowContext, Settings>
  > = {},
) => {
  const parseSettings = jest.fn(
    (settings: unknown) =>
      ({
        timeout_ms: 0,
        retries: baseRetries,
        ...(settings as Record<string, unknown>),
        parsed: true,
      }) as unknown as Settings & { parsed: boolean },
  ) as Action<unknown, unknown, BaseWorkflowContext, Settings>['parseSettings'];
  const action: Action<unknown, unknown, BaseWorkflowContext, Settings> = {
    name: 'worker_action',
    description: 'test',
    inputSchema: z.any(),
    outputSchema: z.any(),
    settingSchema: z.any(),
    parseInput: jest.fn(),
    parseOutput: jest.fn(),
    parseSettings,
    execute: jest.fn(),
    run: jest.fn(),
    ...overrides,
  };

  return { action, parseSettings };
};

describe('compileWorkflow', () => {
  it('binds actions, merges settings, and builds flow metadata', () => {
    const { action, parseSettings } = createAction();
    const definition: WorkflowDefinition = {
      workflow: { name: 'test_flow', version: '1.0.0' },
      defaults: {
        settings: {
          timeout_ms: 25,
          retries: baseRetries,
          guardrails: { mode: 'default' },
        },
      },
      tasks: {
        worker_task: {
          action: 'worker_action',
          description: 'does work',
          inputs: { source: '=$input.source', literal: 1 },
          outputs: { echoed: '=$result.echoed' },
          settings: {
            timeout_ms: 50,
            audit: true,
            guardrails: { mode: 'strict' },
            retries: {
              max_attempts: 1,
              backoff_ms: 10,
              max_delay_ms: 100,
              jitter: 0,
              multiplier: 2,
            },
          },
        },
      },
      flow: [
        { do: 'worker_task' },
        {
          conditional: {
            description: 'check',
            when: [
              {
                condition: '=$output.worker_task.echoed',
                steps: [{ do: 'worker_task' }],
              },
              {
                else: true,
                steps: [
                  {
                    parallel: {
                      steps: [{ do: 'worker_task' }],
                      strategy: 'wait_any',
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          loop: {
            name: 'looping',
            description: 'loop desc',
            for_each: { item: 'item', in: '=$input.items' },
            accumulate: { as: 'total', initial: 0, merge: '=$accumulator + 1' },
            until: '=$iteration.index > 1',
            steps: [{ do: 'worker_task' }],
          },
        },
      ],
      outputs: { final: '=$output.worker_task.echoed' },
      inputs: {
        schema: {
          source: { type: 'string' },
          items: { type: 'array', items: { type: 'string' } },
        },
      },
    };
    const compiled = compileWorkflow(definition, { worker_action: action });

    expect(parseSettings).toHaveBeenCalledWith({
      timeout_ms: 50,
      retries: { ...baseRetries, max_attempts: 1 },
      guardrails: { mode: 'strict' },
      audit: true,
    });
    expect(compiled.tasks.worker_task.settings).toMatchObject({
      parsed: true,
      audit: true,
    });

    expect(compiled.flow[0]).toMatchObject({
      kind: 'do',
      id: '0:do:worker_task',
      stepInfo: { id: '0:worker_task', name: 'worker_task', type: 'task' },
    });

    const conditional = compiled.flow[1];
    if (conditional.kind === 'conditional') {
      expect(conditional.branches).toHaveLength(2);
      expect(conditional.branches[0].condition).toMatchObject({
        kind: 'expression',
        source: '=$output.worker_task.echoed',
      });
    } else {
      throw new Error('Expected conditional branch');
    }

    const loop = compiled.flow[2];
    if (loop.kind === 'loop') {
      expect(loop.forEach.in).toMatchObject({
        kind: 'expression',
        source: '=$input.items',
      });
      expect(loop.accumulate?.merge).toMatchObject({
        kind: 'expression',
        source: '=$accumulator + 1',
      });
    } else {
      throw new Error('Expected loop step');
    }

    expect(
      compiled.inputParser.parse({ source: 'value', items: ['a'] }),
    ).toEqual({ source: 'value', items: ['a'] });
    expect(() =>
      compiled.inputParser.parse({
        source: 'value',
        items: ['a'],
        extra: true,
      }),
    ).toThrow();
  });

  it('throws when an action implementation is missing', () => {
    const definition: WorkflowDefinition = {
      workflow: { name: 'missing_action', version: '1.0.0' },
      tasks: {
        missing: {
          action: 'unknown_action',
          inputs: { value: 1 },
          outputs: { value: '=$input.value' },
        },
      },
      flow: [{ do: 'missing' }],
      outputs: { out: '=$output.missing.value' },
    };

    expect(() =>
      compileWorkflow(
        definition,
        {} as Record<string, Action<unknown, unknown, TestContext, Settings>>,
      ),
    ).toThrow(/No action implementations provided/);
  });
});
