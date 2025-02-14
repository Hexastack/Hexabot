/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Attachment } from '@/attachment/schemas/attachment.schema';
import EventWrapper from '@/channel/lib/EventWrapper';
import { ChannelName } from '@/channel/types';
import { PayloadType } from '@/chat/schemas/types/button';
import {
  IncomingMessageType,
  StdEventType,
  StdIncomingMessage,
} from '@/chat/schemas/types/message';
import { Payload } from '@/chat/schemas/types/quick-reply';

import BaseWebChannelHandler from './base-web-channel';
import { WEB_CHANNEL_NAME } from './settings';
import { Web } from './types';

type WebEventAdapter =
  | {
      eventType: StdEventType.unknown;
      messageType: never;
      raw: Web.Event;
      attachment: never;
    }
  | {
      eventType: StdEventType.read;
      messageType: never;
      raw: Web.StatusReadEvent;
      attachment: never;
    }
  | {
      eventType: StdEventType.delivery;
      messageType: never;
      raw: Web.StatusDeliveryEvent;
      attachment: never;
    }
  | {
      eventType: StdEventType.typing;
      messageType: never;
      raw: Web.StatusTypingEvent;
      attachment: never;
    }
  | {
      eventType: StdEventType.message;
      messageType: IncomingMessageType.message;
      raw: Web.IncomingMessage<Web.IncomingTextMessage>;
      attachment: never;
    }
  | {
      eventType: StdEventType.message;
      messageType:
        | IncomingMessageType.postback
        | IncomingMessageType.quick_reply;
      raw: Web.IncomingMessage<Web.IncomingPayloadMessage>;
      attachment: never;
    }
  | {
      eventType: StdEventType.message;
      messageType: IncomingMessageType.location;
      raw: Web.IncomingMessage<Web.IncomingLocationMessage>;
      attachment: never;
    }
  | {
      eventType: StdEventType.message;
      messageType: IncomingMessageType.attachments;
      raw: Web.IncomingMessage<Web.IncomingAttachmentMessage>;
      attachment: Attachment | null;
    };

// eslint-disable-next-line prettier/prettier
export default class WebEventWrapper<
  N extends ChannelName,
> extends EventWrapper<WebEventAdapter, Web.Event, N> {
  /**
   * Constructor : channel's event wrapper
   *
   * @param handler - The channel's handler
   * @param event - The message event received
   * @param channelAttrs - Channel's specific extra attributes {isSocket, ipAddress}
   */
  constructor(
    handler: BaseWebChannelHandler<N>,
    event: Web.Event,
    channelAttrs: SubscriberChannelDict[typeof WEB_CHANNEL_NAME],
  ) {
    super(handler, event, channelAttrs);
  }

  /**
   * Called by the parent constructor, it defines :
   *     - The type of event received
   *     - The type of message when the event is a message.
   *     - Sets a typed raw object of the event data
   *
   * @param event - The message event received
   */
  _init(event: Web.Event) {
    switch (event.type) {
      case Web.StatusEventType.delivery:
        this._adapter.eventType = StdEventType.delivery;
        break;
      case Web.StatusEventType.read:
        this._adapter.eventType = StdEventType.read;
        break;
      case Web.StatusEventType.typing:
        this._adapter.eventType = StdEventType.typing;
        break;
      case Web.IncomingMessageType.text:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.message;
        break;
      case Web.IncomingMessageType.quick_reply:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.quick_reply;
        break;
      case Web.IncomingMessageType.postback:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.postback;
        break;
      case Web.IncomingMessageType.location:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.location;
        break;
      case Web.IncomingMessageType.file:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.attachments;
        break;

      default:
        this._adapter.eventType = StdEventType.unknown;
        break;
    }
    this._adapter.raw = event;
  }

  /**
   * Returns the message id
   *
   * @returns The message ID
   */
  getId(): string {
    if (this._adapter.eventType === StdEventType.message) {
      if (this._adapter.raw.mid) {
        return this._adapter.raw.mid;
      }
      throw new Error('The message id `mid` has not been set');
    }
    throw new Error('The id (`mid`) is only available in message events');
  }

  /**
   * Returns the event sender id
   *
   * @returns Subscriber ID
   */
  getSenderForeignId(): string {
    if (this._adapter.eventType === StdEventType.message) {
      if (this._adapter.raw.author) {
        return this._adapter.raw.author;
      }
      throw new Error('The message author has not been set');
    }
    throw new Error('The `author` is only available in message events');
  }

  /**
   * Returns event recipient id
   *
   * @returns Subscriber ID
   */
  getRecipientForeignId(): string {
    // @TODO : Implement echo messaging to sync messages sent by third party
    return '';
  }

  /**
   * Returns the type of event received
   *
   * @returns The standardized event type
   */
  getEventType(): StdEventType {
    return this._adapter.eventType;
  }

  /**
   * Finds out and return the type of the event recieved from the widget
   *
   * @returns The type of message
   */
  getMessageType(): IncomingMessageType {
    return this._adapter.messageType || IncomingMessageType.unknown;
  }

  /**
   * Return payload whenever user clicks on a button/quick_reply or sends an attachment
   *
   * @returns The payload content
   */
  getPayload(): Payload | string | undefined {
    switch (this._adapter.messageType) {
      case IncomingMessageType.postback:
      case IncomingMessageType.quick_reply:
        return this._adapter.raw.data.payload;

      case IncomingMessageType.location: {
        const coordinates = this._adapter.raw.data.coordinates;
        return {
          type: PayloadType.location,
          coordinates: {
            lat: coordinates.lat,
            lon: coordinates.lng,
          },
        };
      }
      case IncomingMessageType.attachments:
        if (!this._adapter.attachment) {
          throw new Error('Attachment has not been processed');
        }

        return {
          type: PayloadType.attachments,
          attachment: {
            type: Attachment.getTypeByMime(this._adapter.raw.data.type),
            payload: {
              id: this._adapter.attachment.id,
            },
          },
        };

      default:
        return undefined;
    }
  }

  /**
   * Return a standard message format that can be stored in DB
   *
   * @returns Received message in a standard format
   */
  getMessage(): StdIncomingMessage {
    switch (this._adapter.messageType) {
      case IncomingMessageType.message:
        return {
          text: this._adapter.raw.data.text,
        };

      case IncomingMessageType.quick_reply:
      case IncomingMessageType.postback:
        return {
          postback: this._adapter.raw.data.payload,
          text: this._adapter.raw.data.text,
        };

      case IncomingMessageType.location: {
        const coordinates = this._adapter.raw.data.coordinates;
        return {
          type: PayloadType.location,
          coordinates: {
            lat: coordinates.lat,
            lon: coordinates.lng,
          },
        };
      }

      case IncomingMessageType.attachments: {
        if (!this._adapter.attachment) {
          throw new Error('Attachment has not been processed');
        }

        const fileType = Attachment.getTypeByMime(
          this._adapter.attachment.type,
        );
        return {
          type: PayloadType.attachments,
          serialized_text: `attachment:${fileType}:${this._adapter.attachment.name}`,
          attachment: {
            type: fileType,
            payload: {
              id: this._adapter.attachment.id,
            },
          },
        };
      }

      default:
        return {
          text: '',
        };
    }
  }

  /**
   * Return the delivered messages ids
   *
   * @returns Returns the delivered messages ids
   */
  getDeliveredMessages(): string[] {
    return this._adapter.eventType === StdEventType.delivery
      ? [this._adapter.raw.mid]
      : [];
  }

  /**
   * Return the message's timestamp
   *
   * @returns The watermark
   */
  getWatermark(): number {
    return this._adapter.eventType === StdEventType.read
      ? (this._adapter.raw.watermark || 0) / 1000
      : 0;
  }
}
