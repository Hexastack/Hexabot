/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionExecutionArgs } from '@hexabot-ai/agentic';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { attachmentPayloadSchema } from '@/chat/types/attachment';
import { stdIncomingMessageSchema } from '@/chat/types/message';
import { stdQuickReplySchema } from '@/chat/types/quick-reply';

import {
  MessageAction,
  MessageActionContext,
} from '../messaging/message-action.base';

const attachmentInputSchema = z.object({
  attachment: attachmentPayloadSchema,
  quick_replies: z.array(stdQuickReplySchema).optional(),
  options: z.record(z.any()).optional(),
});

type AttachmentInput = z.infer<typeof attachmentInputSchema>;

@Injectable()
export class SendAttachmentAction extends MessageAction<AttachmentInput> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'send_attachment',
        description:
          'Sends an attachment message to the subscriber and waits for the reply.',
        inputSchema: attachmentInputSchema,
        outputSchema: stdIncomingMessageSchema,
      },
      actionService,
    );
  }

  async execute({
    input,
    context,
  }: ActionExecutionArgs<AttachmentInput, MessageActionContext>) {
    const prepared = await this.prepare(context);
    const envelope = prepared.envelopeFactory.buildAttachmentEnvelope(
      input.attachment,
      input.quick_replies ?? [],
    );

    return this.sendPreparedAndSuspend(
      context,
      prepared,
      envelope,
      input.options,
    );
  }
}

export default SendAttachmentAction;
