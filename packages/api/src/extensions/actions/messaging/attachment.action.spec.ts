/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  FileType,
  OutgoingMessageType,
  StdOutgoingMessageEnvelope,
} from '@hexabot-ai/types';

import { ActionService } from '@/actions/actions.service';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

import { SendAttachmentAction } from './attachment.action';
import { MessageActionSettings } from './message-action.base';

describe('SendAttachmentAction', () => {
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

  it('builds an attachment envelope and delegates sending', async () => {
    const action = new SendAttachmentAction(actionService);
    const envelope: StdOutgoingMessageEnvelope = {
      type: OutgoingMessageType.attachment,
      data: {
        attachment: { type: FileType.image, payload: { id: '123' } },
        quickReplies: [],
      },
    };
    const prepared = {
      envelopeFactory: {
        buildAttachmentEnvelope: jest.fn(() => envelope),
      },
    } as any;
    const prepareSpy = jest
      .spyOn(action as any, 'prepare')
      .mockResolvedValue(prepared);
    const sendSpy = jest
      .spyOn(action as any, 'sendPreparedMessage')
      .mockResolvedValue('result');
    const input: Parameters<SendAttachmentAction['execute']>[0]['input'] = {
      quick_replies: [],
      attachment: { type: FileType.image, payload: { id: '123' } },
    };
    const result = await action.execute({
      input,
      context,
      settings: {} as MessageActionSettings,
      bindings: {} as any,
    });

    expect(prepareSpy).toHaveBeenCalledWith(context);
    expect(
      prepared.envelopeFactory.buildAttachmentEnvelope,
    ).toHaveBeenCalledWith(input.attachment, []);
    expect(sendSpy).toHaveBeenCalledWith(context, prepared, envelope, {});
    expect(result).toBe('result');
  });
});
