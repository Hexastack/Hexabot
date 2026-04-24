/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  FileType,
  IncomingMessageType,
  type StdIncomingMessage,
} from '@hexabot-ai/types';

import { ChannelAttachmentService } from '@/channel/services/channel-attachment.service';
import { ChannelName } from '@/channel/types';

import { Web } from '../types';

export class WebInboundMessageEncoder {
  constructor(
    private readonly channelAttachmentService: Pick<
      ChannelAttachmentService,
      'getPublicUrl'
    >,
  ) {}

  async encode(
    message: StdIncomingMessage,
    channelName: ChannelName,
  ): Promise<Web.InboundMessageBase> {
    switch (message.type) {
      case IncomingMessageType.text:
        return {
          type: Web.InboundMessageType.text,
          data: message.data,
        };
      case IncomingMessageType.postback:
        return {
          type: Web.InboundMessageType.postback,
          data: message.data,
        };
      case IncomingMessageType.quickReply:
        return {
          type: Web.InboundMessageType.quick_reply,
          data: message.data,
        };
      case IncomingMessageType.location: {
        const { lat, lon } = message.data.coordinates;

        return {
          type: Web.InboundMessageType.location,
          data: { coordinates: { lat, lng: lon } },
        };
      }
      case IncomingMessageType.attachment: {
        const attachmentPayload = Array.isArray(message.data.attachment)
          ? message.data.attachment[0]
          : message.data.attachment;

        return {
          type: Web.InboundMessageType.file,
          data: {
            type: attachmentPayload?.type ?? FileType.unknown,
            url: await this.channelAttachmentService.getPublicUrl(
              channelName,
              attachmentPayload?.payload,
            ),
          },
        };
      }
      default:
        return {
          type: Web.InboundMessageType.text,
          data: { text: '' },
        };
    }
  }
}
