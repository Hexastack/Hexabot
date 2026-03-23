/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { SubscriberHandoverAction } from './handover.action';

describe('SubscriberHandoverAction', () => {
  let actionService: ActionService;
  let action: InstanceType<typeof SubscriberHandoverAction>;
  let handOverByPolicy: jest.Mock;
  let context: ConversationalWorkflowContext;

  const SUBSCRIBER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const USER_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

  beforeEach(() => {
    jest.clearAllMocks();
    handOverByPolicy = jest.fn();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new SubscriberHandoverAction(actionService);
    context = {
      event: {
        getInitiator: jest.fn(() => ({
          id: SUBSCRIBER_ID,
          assignedTo: null,
        })),
      },
      services: {
        subscriber: {
          handOverByPolicy,
        },
      },
    } as unknown as ConversationalWorkflowContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('executes specific handover mode and maps the result payload', async () => {
    handOverByPolicy.mockResolvedValue({
      success: true,
      mode: 'specific',
      subscriber: {
        id: SUBSCRIBER_ID,
        assignedTo: USER_ID,
      },
      assignedTo: USER_ID,
    });

    const result = await action.execute({
      input: { mode: 'specific', user_id: USER_ID },
      context,
      settings: {} as any,
      bindings: {} as any,
    });

    expect(handOverByPolicy).toHaveBeenCalledTimes(1);
    expect(handOverByPolicy).toHaveBeenCalledWith(
      expect.objectContaining({ id: SUBSCRIBER_ID }),
      {
        mode: 'specific',
        userId: USER_ID,
      },
    );
    expect(result).toEqual({
      success: true,
      mode: 'specific',
      subscriber_id: SUBSCRIBER_ID,
      assigned_to: USER_ID,
    });
  });

  it('returns structured no-op output when auto mode has no candidate', async () => {
    handOverByPolicy.mockResolvedValue({
      success: false,
      mode: 'auto',
      subscriber: {
        id: SUBSCRIBER_ID,
        assignedTo: null,
      },
      assignedTo: null,
      reason: 'no_available_user',
    });

    const result = await action.execute({
      input: { mode: 'auto' },
      context,
      settings: {} as any,
      bindings: {} as any,
    });

    expect(result).toEqual({
      success: false,
      mode: 'auto',
      subscriber_id: SUBSCRIBER_ID,
      assigned_to: null,
      reason: 'no_available_user',
    });
  });

  it('validates schema: user_id is required for specific mode', () => {
    expect(() => action.parseInput({ mode: 'specific' })).toThrow(
      /user_id.*specific/,
    );
  });

  it('throws when event is missing on the context', async () => {
    const invalidContext = {
      ...context,
      event: undefined,
    } as unknown as ConversationalWorkflowContext;

    await expect(
      action.execute({
        input: { mode: 'auto' },
        context: invalidContext,
        settings: {} as any,
        bindings: {} as any,
      }),
    ).rejects.toThrow('Missing event on workflow context');
  });

  it('throws when event initiator is missing', async () => {
    const invalidContext = {
      ...context,
      event: {
        getInitiator: jest.fn(() => undefined),
      },
    } as unknown as ConversationalWorkflowContext;

    await expect(
      action.execute({
        input: { mode: 'auto' },
        context: invalidContext,
        settings: {} as any,
        bindings: {} as any,
      }),
    ).rejects.toThrow('Missing subscriber on event');
  });
});
