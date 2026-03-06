/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { UpdateMemoryAction } from './update-memory.action';

describe('UpdateMemoryAction', () => {
  let actionService: ActionService;
  let action: UpdateMemoryAction;

  const buildContext = (update: jest.Mock) =>
    ({ memoryStore: { update } }) as unknown as WorkflowRuntimeContext;

  beforeEach(() => {
    jest.clearAllMocks();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new UpdateMemoryAction(actionService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('delegates to memoryStore.update and returns the updated memory', async () => {
    const update = jest.fn().mockResolvedValue({
      profile: { name: 'Ada', role: 'admin' },
      run_state: { step: 2 },
    });
    const context = buildContext(update);
    const input = { memory: { profile: { name: 'Ada' } } };
    const result = await action.execute({
      input,
      context,
      settings: {} as any,
      bindings: {} as any,
    });

    expect(update).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledWith(input.memory);
    expect(result).toEqual({
      memory: {
        profile: { name: 'Ada', role: 'admin' },
        run_state: { step: 2 },
      },
    });
  });

  it('rejects invalid memory slugs in the input schema', () => {
    expect(() =>
      action.parseInput({
        memory: { 'bad-slug': { name: 'Ada' } },
      }),
    ).toThrow(
      /slug must contain only lowercase letters, numbers, and underscores/,
    );
  });

  it('requires the memory field in the input schema', () => {
    expect(() => action.parseInput({})).toThrow();
  });
});
