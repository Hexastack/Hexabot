/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ActionOptions,
  AttachmentRef,
  Button,
  ButtonType,
  ContentElement,
  OutgoingMessageFormat,
  StdOutgoingAttachmentMessage,
  StdOutgoingButtonsMessage,
  StdOutgoingListMessage,
  StdOutgoingMessageEnvelope,
  StdOutgoingQuickRepliesMessage,
  StdOutgoingTextMessage,
} from '@hexabot-ai/types';
import { Injectable, Type } from '@nestjs/common';

import { ChannelOutboundMessageEncoder } from '@/channel/lib/outbound';
import { ChannelAttachmentService } from '@/channel/services/channel-attachment.service';
import { ChannelName } from '@/channel/types';
import { VIEW_MORE_PAYLOAD } from '@/chat/helpers/constants';
import { ContentOrmEntity } from '@/cms/entities/content.entity';
import { I18nService } from '@/i18n';
import { LoggerService } from '@/logger';

import { Web } from '../types';

export type WebOutboundEncodeOptions = ActionOptions;

export class WebOutboundMessageEncoder extends ChannelOutboundMessageEncoder<
  Web.OutboundMessageBase,
  WebOutboundEncodeOptions
> {
  constructor(
    private readonly channelName: ChannelName,
    private readonly i18n: I18nService,
    private readonly logger: LoggerService,
    private readonly channelAttachmentService: ChannelAttachmentService,
  ) {
    super();
  }

  async encode(
    envelope: StdOutgoingMessageEnvelope,
    options: WebOutboundEncodeOptions = {},
  ): Promise<Web.OutboundMessageBase> {
    return await this.dispatchEnvelope(envelope, options, {
      [OutgoingMessageFormat.text]: ({ message }) =>
        this.encodeTextMessage(message),
      [OutgoingMessageFormat.quickReplies]: ({ message }) =>
        this.encodeQuickRepliesMessage(message),
      [OutgoingMessageFormat.buttons]: ({ message }) =>
        this.encodeButtonsMessage(message),
      [OutgoingMessageFormat.attachment]: ({ message }) =>
        this.encodeAttachmentMessage(message),
      [OutgoingMessageFormat.list]: ({ message }, actionOptions) =>
        this.encodeListMessage(message, actionOptions),
      [OutgoingMessageFormat.carousel]: ({ message }, actionOptions) =>
        this.encodeCarouselMessage(message, actionOptions),
    });
  }

  protected encodeTextMessage(
    message: StdOutgoingTextMessage,
  ): Web.OutboundMessageBase {
    return {
      type: Web.OutboundMessageType.text,
      data: message,
    };
  }

  protected encodeQuickRepliesMessage(
    message: StdOutgoingQuickRepliesMessage,
  ): Web.OutboundMessageBase {
    return {
      type: Web.OutboundMessageType.quick_replies,
      data: {
        text: message.text,
        quick_replies: message.quickReplies,
      },
    };
  }

  protected encodeButtonsMessage(
    message: StdOutgoingButtonsMessage,
  ): Web.OutboundMessageBase {
    return {
      type: Web.OutboundMessageType.buttons,
      data: {
        text: message.text,
        buttons: message.buttons,
      },
    };
  }

  protected async encodeAttachmentMessage(
    message: StdOutgoingAttachmentMessage,
  ): Promise<Web.OutboundMessageBase> {
    const payload: Web.OutboundMessageBase = {
      type: Web.OutboundMessageType.file,
      data: {
        type: message.attachment.type,
        url: await this.channelAttachmentService.getPublicUrl(
          this.channelName,
          message.attachment.payload,
        ),
      },
    };
    if (message.quickReplies && message.quickReplies.length > 0) {
      return {
        ...payload,
        data: {
          ...payload.data,
          quick_replies: message.quickReplies,
        } as Web.OutboundFileMessageData,
      };
    }

    return payload;
  }

  protected async encodeContentElements(
    data: ContentElement[],
    options: ActionOptions,
  ): Promise<Web.MessageElement[]> {
    if (!options.content || !options.content.fields) {
      throw new Error('Content options are missing the fields');
    }

    const fields = options.content.fields;
    const buttons: Button[] = options.content.buttons;
    const result: Web.MessageElement[] = [];

    for (const item of data) {
      const element: Web.MessageElement = {
        title: item[fields.title],
        buttons: item.buttons || [],
      };

      if (fields.subtitle && item[fields.subtitle]) {
        element.subtitle = item[fields.subtitle];
      }

      if (fields.image_url && item[fields.image_url]) {
        const attachmentRef =
          typeof item[fields.image_url] === 'string'
            ? { url: item[fields.image_url] }
            : (item[fields.image_url].payload as AttachmentRef);
        element.image_url = await this.channelAttachmentService.getPublicUrl(
          this.channelName,
          attachmentRef,
        );
      }

      buttons.forEach((button: Button, index) => {
        const btn = { ...button };
        if (btn.type === ButtonType.web_url) {
          const urlField = fields.url;
          btn.url =
            urlField && item[urlField]
              ? item[urlField]
              : ContentOrmEntity.getUrl(item);
          if (!btn.url.startsWith('http')) {
            btn.url = 'https://' + btn.url;
          }
          if (!element.default_action) {
            const { title: _title, ...defaultAction } = btn;
            element.default_action = defaultAction;
          }
        } else {
          if (
            'action_payload' in fields &&
            fields.action_payload &&
            fields.action_payload in item
          ) {
            btn.payload = btn.title + ':' + item[fields.action_payload];
          } else {
            const postback = ContentOrmEntity.getPayload(item);
            btn.payload = btn.title + ':' + postback;
          }
        }
        if (index === 0 && fields.action_title && item[fields.action_title]) {
          btn.title = item[fields.action_title];
        }
        element.buttons?.push(btn);
      });

      if (Array.isArray(element.buttons) && element.buttons.length === 0) {
        delete element.buttons;
      }

      result.push(element);
    }

    return result;
  }

  protected async encodeListMessage(
    message: StdOutgoingListMessage,
    options: ActionOptions,
  ): Promise<Web.OutboundMessageBase> {
    const data = message.elements || [];
    const pagination = message.pagination;
    let buttons: Button[] = [],
      elements: Web.MessageElement[] = [];

    if (!data.length) {
      this.logger.error('Insufficient content count (must be >= 0 for list)');
      throw new Error('Insufficient content count (list >= 0)');
    }

    if (pagination.total - pagination.skip - pagination.limit > 0) {
      buttons = [
        {
          type: ButtonType.postback,
          title: this.i18n.t('View More'),
          payload: VIEW_MORE_PAYLOAD,
        },
      ];
    }

    elements = await this.encodeContentElements(data, options);
    const topElementStyle = options.content?.top_element_style
      ? {
          top_element_style: options.content?.top_element_style,
        }
      : {};

    return {
      type: Web.OutboundMessageType.list,
      data: {
        elements,
        buttons,
        ...topElementStyle,
      },
    };
  }

  protected async encodeCarouselMessage(
    message: StdOutgoingListMessage,
    options: ActionOptions,
  ): Promise<Web.OutboundMessageBase> {
    const data = message.elements || [];
    if (data.length === 0) {
      this.logger.error(
        'Insufficient content count (must be > 0 for carousel)',
      );
      throw new Error('Insufficient content count (carousel > 0)');
    }

    const elements = await this.encodeContentElements(data, options);

    return {
      type: Web.OutboundMessageType.carousel,
      data: {
        elements,
      },
    };
  }
}

export function createWebOutboundMessageEncoder(
  channelName: ChannelName,
): Type<WebOutboundMessageEncoder> {
  @Injectable()
  class BoundWebOutboundMessageEncoder extends WebOutboundMessageEncoder {
    constructor(
      i18n: I18nService,
      logger: LoggerService,
      channelAttachmentService: ChannelAttachmentService,
    ) {
      super(channelName, i18n, logger, channelAttachmentService);
    }
  }

  return BoundWebOutboundMessageEncoder;
}

export default WebOutboundMessageEncoder;
