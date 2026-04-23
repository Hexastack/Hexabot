/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ButtonType,
  OutgoingMessageType,
  StdOutgoingMessageEnvelope,
} from '@hexabot-ai/types';

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { SendButtonsAction } from './buttons.action';
import { MessageActionSettings } from './message-action.base';

describe('SendButtonsAction', () => {
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

  it('builds a buttons envelope and delegates sending', async () => {
    const action = new SendButtonsAction(actionService);
    const envelope: StdOutgoingMessageEnvelope = {
      type: OutgoingMessageType.buttons,
      data: { text: 'processed', buttons: [] },
    };
    const prepared = {
      envelopeFactory: {
        buildButtonsEnvelope: jest.fn(() => envelope),
      },
    } as any;
    const prepareSpy = jest
      .spyOn(action as any, 'prepare')
      .mockResolvedValue(prepared);
    const sendSpy = jest
      .spyOn(action as any, 'sendPreparedMessage')
      .mockResolvedValue('result');
    const input: Parameters<SendButtonsAction['execute']>[0]['input'] = {
      text: 'Choose',
      buttons: [
        { type: ButtonType.postback, title: 'One', payload: 'one' },
        {
          type: ButtonType.web_url,
          title: 'Docs',
          url: 'https://hexabot.ai',
        },
      ],
    };
    const result = await action.execute({
      input,
      context,
      settings: {} as MessageActionSettings,
      bindings: {} as any,
    });

    expect(prepareSpy).toHaveBeenCalledWith(context);
    expect(prepared.envelopeFactory.buildButtonsEnvelope).toHaveBeenCalledWith(
      input.text,
      input.buttons,
    );
    expect(sendSpy).toHaveBeenCalledWith(context, prepared, envelope, {});
    expect(result).toBe('result');
  });
});
