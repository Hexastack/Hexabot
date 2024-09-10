/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import EventWrapper from '@/channel/lib/EventWrapper';
import {
  AttachmentForeignKey,
  AttachmentPayload,
} from '@/chat/schemas/types/attachment';
import {
  IncomingMessageType,
  PayloadType,
  StdEventType,
  StdIncomingMessage,
} from '@/chat/schemas/types/message';
import { Payload } from '@/chat/schemas/types/quick-reply';

import OfflineHandler from './index.channel';
import { Offline } from './types';

type OfflineEventAdapter =
  | {
      eventType: StdEventType.unknown;
      messageType: never;
      raw: Offline.Event;
    }
  | {
      eventType: StdEventType.read;
      messageType: never;
      raw: Offline.StatusReadEvent;
    }
  | {
      eventType: StdEventType.delivery;
      messageType: never;
      raw: Offline.StatusDeliveryEvent;
    }
  | {
      eventType: StdEventType.typing;
      messageType: never;
      raw: Offline.StatusTypingEvent;
    }
  | {
      eventType: StdEventType.message;
      messageType: IncomingMessageType.message;
      raw: Offline.IncomingMessage<Offline.IncomingTextMessage>;
    }
  | {
      eventType: StdEventType.message;
      messageType:
        | IncomingMessageType.postback
        | IncomingMessageType.quick_reply;
      raw: Offline.IncomingMessage<Offline.IncomingPayloadMessage>;
    }
  | {
      eventType: StdEventType.message;
      messageType: IncomingMessageType.location;
      raw: Offline.IncomingMessage<Offline.IncomingLocationMessage>;
    }
  | {
      eventType: StdEventType.message;
      messageType: IncomingMessageType.attachments;
      raw: Offline.IncomingMessage<Offline.IncomingAttachmentMessage>;
    };

export default class OfflineEventWrapper extends EventWrapper<
  OfflineEventAdapter,
  Offline.Event
> {
  /**
   * Constructor : channel's event wrapper
   *
   * @param handler - The channel's handler
   * @param event - The message event received
   * @param channelData - Channel's specific extra data {isSocket, ipAddress}
   */
  constructor(handler: OfflineHandler, event: Offline.Event, channelData: any) {
    super(handler, event, channelData);
  }

  /**
   * Called by the parent constructor, it defines :
   *     - The type of event received
   *     - The type of message when the event is a message.
   *     - Sets a typed raw object of the event data
   *
   * @param event - The message event received
   */
  _init(event: Offline.Event) {
    switch (event.type) {
      case Offline.StatusEventType.delivery:
        this._adapter.eventType = StdEventType.delivery;
        break;
      case Offline.StatusEventType.read:
        this._adapter.eventType = StdEventType.read;
        break;
      case Offline.StatusEventType.typing:
        this._adapter.eventType = StdEventType.typing;
        break;
      case Offline.IncomingMessageType.text:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.message;
        break;
      case Offline.IncomingMessageType.quick_reply:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.quick_reply;
        break;
      case Offline.IncomingMessageType.postback:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.postback;
        break;
      case Offline.IncomingMessageType.location:
        this._adapter.eventType = StdEventType.message;
        this._adapter.messageType = IncomingMessageType.location;
        break;
      case Offline.IncomingMessageType.file:
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
   * Returns channel related data
   *
   * @returns Channel's data
   */
  getChannelData(): any {
    return this.get('channelData', {
      isSocket: true,
      ipAddress: '0.0.0.0',
      agent:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36',
    });
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
        return {
          type: PayloadType.attachments,
          attachments: {
            type: this._adapter.raw.data.type,
            payload: {
              url: this._adapter.raw.data.url,
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
        const attachment = this._adapter.raw.data;
        return {
          type: PayloadType.attachments,
          serialized_text: `attachment:${attachment.type}:${attachment.url}`,
          attachment: {
            type: attachment.type,
            payload: {
              url: attachment.url,
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
   * Return the list of recieved attachments
   *
   * @deprecated
   * @returns Received attachments message
   */
  getAttachments(): AttachmentPayload<AttachmentForeignKey>[] {
    const message = this.getMessage() as any;
    return 'attachment' in message ? [].concat(message.attachment) : [];
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
