/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { SubscriberUpdateLabelsAction } from './update-labels.action';

describe('SubscriberUpdateLabelsAction', () => {
  let actionService: ActionService;
  let action: InstanceType<typeof SubscriberUpdateLabelsAction>;
  let updateLabels: jest.Mock;
  let syncInitiatorState: jest.Mock;
  let setInitiator: jest.Mock;
  let context: ConversationalWorkflowContext;

  const SUBSCRIBER_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const EXISTING_LABEL_ID = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const NEW_LABEL_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  beforeEach(() => {
    jest.clearAllMocks();
    updateLabels = jest.fn();
    syncInitiatorState = jest.fn().mockResolvedValue(undefined);
    setInitiator = jest.fn();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new SubscriberUpdateLabelsAction(actionService);
    context = {
      event: {
        getInitiator: jest.fn(() => ({
          id: SUBSCRIBER_ID,
          labels: [EXISTING_LABEL_ID],
        })),
        setInitiator,
      },
      syncInitiatorState,
      services: {
        subscriber: {
          updateLabels,
        },
      },
    } as unknown as ConversationalWorkflowContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('executes assign-only label updates and maps output payload', async () => {
    updateLabels.mockResolvedValue({
      id: SUBSCRIBER_ID,
      labels: [EXISTING_LABEL_ID, NEW_LABEL_ID],
    });

    const result = await action.execute({
      input: { labels_to_assign: [NEW_LABEL_ID] },
      context,
      settings: {} as any,
      bindings: {} as any,
    });

    expect(updateLabels).toHaveBeenCalledTimes(1);
    expect(updateLabels).toHaveBeenCalledWith(
      expect.objectContaining({ id: SUBSCRIBER_ID }),
      [NEW_LABEL_ID],
      undefined,
    );
    expect(setInitiator).toHaveBeenCalledWith({
      id: SUBSCRIBER_ID,
      labels: [EXISTING_LABEL_ID, NEW_LABEL_ID],
    });
    expect(syncInitiatorState).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      subscriber_id: SUBSCRIBER_ID,
      labels: [EXISTING_LABEL_ID, NEW_LABEL_ID],
    });
  });

  it('executes remove-only label updates', async () => {
    updateLabels.mockResolvedValue({
      id: SUBSCRIBER_ID,
      labels: [],
    });

    const result = await action.execute({
      input: { labels_to_remove: [EXISTING_LABEL_ID] },
      context,
      settings: {} as any,
      bindings: {} as any,
    });

    expect(updateLabels).toHaveBeenCalledWith(
      expect.objectContaining({ id: SUBSCRIBER_ID }),
      undefined,
      [EXISTING_LABEL_ID],
    );
    expect(setInitiator).toHaveBeenCalledWith({
      id: SUBSCRIBER_ID,
      labels: [],
    });
    expect(syncInitiatorState).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      subscriber_id: SUBSCRIBER_ID,
      labels: [],
    });
  });

  it('executes mixed assign/remove label updates', async () => {
    updateLabels.mockResolvedValue({
      id: SUBSCRIBER_ID,
      labels: [NEW_LABEL_ID],
    });

    const result = await action.execute({
      input: {
        labels_to_assign: [NEW_LABEL_ID],
        labels_to_remove: [EXISTING_LABEL_ID, NEW_LABEL_ID],
      },
      context,
      settings: {} as any,
      bindings: {} as any,
    });

    expect(updateLabels).toHaveBeenCalledWith(
      expect.objectContaining({ id: SUBSCRIBER_ID }),
      [NEW_LABEL_ID],
      [EXISTING_LABEL_ID, NEW_LABEL_ID],
    );
    expect(setInitiator).toHaveBeenCalledWith({
      id: SUBSCRIBER_ID,
      labels: [NEW_LABEL_ID],
    });
    expect(syncInitiatorState).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      success: true,
      subscriber_id: SUBSCRIBER_ID,
      labels: [NEW_LABEL_ID],
    });
  });

  it('validates schema: at least one label operation is required', () => {
    expect(() => action.parseInput({})).toThrow(
      /At least one label operation is required/,
    );
    expect(() =>
      action.parseInput({
        labels_to_assign: [],
        labels_to_remove: [],
      }),
    ).toThrow(/At least one label operation is required/);
  });

  it('throws when event is missing on the context', async () => {
    const invalidContext = {
      ...context,
      event: undefined,
    } as unknown as ConversationalWorkflowContext;

    await expect(
      action.execute({
        input: { labels_to_assign: [NEW_LABEL_ID] },
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
        input: { labels_to_assign: [NEW_LABEL_ID] },
        context: invalidContext,
        settings: {} as any,
        bindings: {} as any,
      }),
    ).rejects.toThrow('Missing subscriber on event');
  });
});
