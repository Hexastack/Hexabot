/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageType,
  StdOutgoingMessageEnvelope,
} from '@hexabot-ai/types';

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { MessageActionSettings } from './message-action.base';
import { SendQuickRepliesAction } from './quick-replies.action';

describe('SendQuickRepliesAction', () => {
  let actionService: ActionService;
  let context: ConversationalWorkflowContext;

  beforeEach(() => {
    actionService = { register: jest.fn() } as unknown as ActionService;
    context = {} as ConversationalWorkflowContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('builds a quick replies envelope and delegates sending', async () => {
    const action = new SendQuickRepliesAction(actionService);
    const envelope: StdOutgoingMessageEnvelope = {
      type: OutgoingMessageType.quickReply,
      data: { text: 'processed', quickReplies: [] },
    };
    const prepared = {
      envelopeFactory: {
        buildQuickRepliesEnvelope: jest.fn(() => envelope),
      },
    } as any;
    const prepareSpy = jest
      .spyOn(action as any, 'prepare')
      .mockResolvedValue(prepared);
    const sendSpy = jest
      .spyOn(action as any, 'sendPreparedMessage')
      .mockResolvedValue('result');
    const input = {
      text: 'Pick one',
      quick_replies: [{ title: 'Yes', payload: 'yes' }],
    };
    const result = await action.execute({
      input,
      context,
      settings: {} as MessageActionSettings,
      bindings: {} as any,
    });

    expect(prepareSpy).toHaveBeenCalledWith(context);
    expect(
      prepared.envelopeFactory.buildQuickRepliesEnvelope,
    ).toHaveBeenCalledWith(input.text, input.quick_replies);
    expect(sendSpy).toHaveBeenCalledWith(context, prepared, envelope, {});
    expect(result).toBe('result');
  });
});
