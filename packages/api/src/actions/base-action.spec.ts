/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { ActionService } from './actions.service';
import { BaseAction } from './base-action';
import { ExecArgs } from './types';

type EmptyPayload = Record<string, never>;

class TestAction extends BaseAction<
  EmptyPayload,
  EmptyPayload,
  WorkflowRuntimeContext,
  EmptyPayload
> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'test_action',
        description: 'Test action',
      },
      actionService,
    );
  }

  async execute(
    _args: ExecArgs<EmptyPayload, WorkflowRuntimeContext, EmptyPayload>,
  ): Promise<EmptyPayload> {
    return {};
  }
}

describe('BaseAction', () => {
  it('registers the action on module init', async () => {
    const actionService = {
      register: jest.fn(),
    } as unknown as ActionService;
    const action = new TestAction(actionService);

    await expect(action.onModuleInit()).resolves.toBeUndefined();
    expect(actionService.register).toHaveBeenCalledWith(action);
  });
});
