/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Attachment } from '@hexabot-ai/types';
import {
  FileType,
  PayloadType,
  IncomingMessageType,
  StdIncomingMessage,
  Payload,
} from '@hexabot-ai/types';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { ChannelInboundEventContext } from '@/channel/lib/inbound-events';
import { ChannelName } from '@/channel/types';

import { Web } from '../../../types';

import WebMessageInboundEvent from './web-message.event';

export class AttachmentMessageInboundEvent<
  N extends ChannelName = ChannelName,
> extends WebMessageInboundEvent<
  N,
  Web.InboundMessage<Web.InboundAttachmentMessage>
> {
  private uploadedAttachment: Attachment | null = null;

  private persistedAttachments: Attachment[] = [];

  constructor(
    context: ChannelInboundEventContext<
      N,
      Web.InboundMessage<Web.InboundAttachmentMessage>,
      SubscriberChannelDict[N]
    >,
    private readonly mimeType: string,
    private readonly originalName?: string,
  ) {
    super(context);
  }

  override getMessageType(): IncomingMessageType {
    return IncomingMessageType.attachments;
  }

  setUploadedAttachment(attachment: Attachment): void {
    this.uploadedAttachment = attachment;
  }

  setPersistedAttachments(attachments: Attachment[]): void {
    this.persistedAttachments = attachments;
  }

  hasResolvedAttachment(): boolean {
    return Boolean(this.uploadedAttachment || this.persistedAttachments[0]);
  }

  setUploadedRawData(fileType: FileType, url: string): void {
    const raw = this.getRaw<Web.InboundMessage<Web.InboundAttachmentMessage>>();

    raw.data = {
      type: fileType,
      url,
    };
  }

  override async preprocess(): Promise<void> {
    const handler = this.getHandler();

    if (this.hasResolvedAttachment() || !handler.getMessageAttachments) {
      return;
    }

    await handler.persistMessageAttachments(this);
  }

  private requireResolvedAttachment(): Attachment {
    const attachment = this.uploadedAttachment ?? this.persistedAttachments[0];

    if (!attachment) {
      throw new Error('Attachment has not been processed');
    }

    return attachment;
  }

  private resolveFileType(attachment: Attachment): FileType {
    return AttachmentOrmEntity.getTypeByMime(attachment.type || this.mimeType);
  }

  private resolveAttachmentName(
    attachment: Attachment,
    fileType: FileType,
  ): string {
    const candidate = attachment.name || this.originalName;

    return candidate && candidate.length > 0
      ? candidate
      : `${fileType}-attachment`;
  }

  override getPayload(): Payload {
    const attachment = this.requireResolvedAttachment();
    const fileType = this.resolveFileType(attachment);

    return {
      type: PayloadType.attachments,
      attachment: {
        type: fileType,
        payload: {
          id: attachment.id,
        },
      },
    };
  }

  override toStdIncomingMessage(): StdIncomingMessage {
    const attachment = this.requireResolvedAttachment();
    const fileType = this.resolveFileType(attachment);
    const attachmentName = this.resolveAttachmentName(attachment, fileType);

    return {
      type: PayloadType.attachments,
      serialized_text: `attachment:${fileType}:${attachmentName}`,
      attachment: {
        type: fileType,
        payload: {
          id: attachment.id,
        },
      },
    };
  }
}

export default AttachmentMessageInboundEvent;
