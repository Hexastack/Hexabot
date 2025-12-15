/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionService } from '@/actions/actions.service';
import { FileType } from '@/chat/types/attachment';
import {
  OutgoingMessageFormat,
  StdOutgoingMessageEnvelope,
} from '@/chat/types/message';
import { WorkflowContext } from '@/workflow/services/workflow-context';

import { SendAttachmentAction } from './attachment.action';
import { MessageActionSettings } from './message-action.base';

describe('SendAttachmentAction', () => {
  let actionService: ActionService;
  let context: WorkflowContext;

  beforeEach(() => {
    actionService = { register: jest.fn() } as unknown as ActionService;
    context = {} as WorkflowContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('builds an attachment envelope and delegates sending', async () => {
    const action = new SendAttachmentAction(actionService);
    const envelope: StdOutgoingMessageEnvelope = {
      format: OutgoingMessageFormat.attachment,
      message: {
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
      .spyOn(action as any, 'sendPreparedAndHandleReply')
      .mockResolvedValue('result');
    const input: Parameters<SendAttachmentAction['execute']>[0]['input'] = {
      attachment: { type: FileType.image, payload: { id: '123' } },
    };
    const result = await action.execute({
      input,
      context,
      settings: { await_reply: true } as MessageActionSettings,
    });

    expect(prepareSpy).toHaveBeenCalledWith(context);
    expect(
      prepared.envelopeFactory.buildAttachmentEnvelope,
    ).toHaveBeenCalledWith(input.attachment, []);
    expect(sendSpy).toHaveBeenCalledWith(context, prepared, envelope, {
      await_reply: true,
    });
    expect(result).toBe('result');
  });
});
