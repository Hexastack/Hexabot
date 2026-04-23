/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  OutgoingMessageFormat,
  StdOutgoingMessageEnvelope,
} from '@hexabot-ai/types';

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { MessageActionSettings } from './message-action.base';
import { SendTextMessageAction } from './text-message.action';

describe('SendTextMessageAction', () => {
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

  it('builds a text envelope and delegates sending', async () => {
    const action = new SendTextMessageAction(actionService);
    const envelope: StdOutgoingMessageEnvelope = {
      format: OutgoingMessageFormat.text,
      message: { text: 'processed' },
    };
    const prepared = {
      envelopeFactory: { buildTextEnvelope: jest.fn(() => envelope) },
    } as any;
    const prepareSpy = jest
      .spyOn(action as any, 'prepare')
      .mockResolvedValue(prepared);
    const sendSpy = jest
      .spyOn(action as any, 'sendPreparedMessage')
      .mockResolvedValue('result');
    const result = await action.execute({
      input: { text: 'Hello' },
      context,
      settings: {} as MessageActionSettings,
      bindings: {} as any,
    });

    expect(prepareSpy).toHaveBeenCalledWith(context);
    expect(prepared.envelopeFactory.buildTextEnvelope).toHaveBeenCalledWith(
      'Hello',
    );
    expect(sendSpy).toHaveBeenCalledWith(context, prepared, envelope, {});
    expect(result).toBe('result');
  });
});
