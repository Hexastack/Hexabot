/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { SubscriberFull } from '@/chat/schemas/subscriber.schema';
import { Button, WebUrlButton } from '@/chat/schemas/types/button';
import { FileType } from '@/chat/schemas/types/message';
import { StdQuickReply } from '@/chat/schemas/types/quick-reply';

export namespace Web {
  export type RequestSession = {
    web?: {
      profile: SubscriberFull;
      isSocket: boolean;
      messageQueue: any[];
      polling: boolean;
    };
  };

  export enum StatusEventType {
    delivery = 'delivery',
    read = 'read',
    typing = 'typing',
  }

  export enum IncomingMessageType {
    text = 'text',
    quick_reply = 'quick_reply',
    postback = 'postback',
    location = 'location',
    file = 'file',
  }

  export type EventType = Web.StatusEventType | Web.IncomingMessageType;

  export enum OutgoingMessageType {
    text = 'text',
    buttons = 'buttons',
    quick_replies = 'quick_replies',
    file = 'file',
    list = 'list',
    carousel = 'carousel',
  }

  export type IncomingTextMessageData = { text: string };

  export type IncomingPayloadMessageData = IncomingTextMessageData & {
    payload: string; // Quick reply and button payload are the same
  };

  export type IncomingLocationMessageData = {
    coordinates: {
      lat: number;
      lng: number;
    };
  };

  export type IncomingAttachmentMessageData =
    // When it's a incoming history message
    | {
        type: FileType;
        url: string; // file download url
      }
    // When it's a file upload message
    | {
        type: string; // mime type
        size: number; // file size
        name: string;
        file: Buffer;
      };

  export type IncomingMessageData =
    | IncomingTextMessageData
    | IncomingPayloadMessageData
    | IncomingLocationMessageData
    | IncomingAttachmentMessageData;

  export type StatusDeliveryEvent = {
    type: StatusEventType.delivery;
    mid: string;
  };

  export type StatusReadEvent = {
    type: StatusEventType.read;
    watermark: number;
  };

  export type StatusTypingEvent = {
    type: StatusEventType.typing;
  };

  export type StatusEvent =
    | StatusDeliveryEvent
    | StatusReadEvent
    | StatusTypingEvent;

  export type IncomingTextMessage = {
    type: IncomingMessageType.text;
    data: IncomingTextMessageData;
  };

  export type IncomingPayloadMessage = {
    type: IncomingMessageType.postback | IncomingMessageType.quick_reply;
    data: IncomingPayloadMessageData;
  };

  export type IncomingLocationMessage = {
    type: IncomingMessageType.location;
    data: IncomingLocationMessageData;
  };

  export type IncomingAttachmentMessage = {
    type: IncomingMessageType.file;
    data: IncomingAttachmentMessageData;
  };

  export type IncomingMessageBase =
    | IncomingTextMessage
    | IncomingPayloadMessage
    | IncomingLocationMessage
    | IncomingAttachmentMessage;

  export type IncomingMessage<
    T =
      | IncomingTextMessage
      | IncomingPayloadMessage
      | IncomingLocationMessage
      | IncomingAttachmentMessage,
  > = T & {
    mid?: string;
    author?: string;
    read?: boolean;
    delivery?: boolean;
    // Whether it's a synchronization
    // This is used when message sent by the chatbot from the client side
    sync?: boolean;
    createdAt?: Date;
  };

  export type Event = IncomingMessage | StatusEvent;

  export interface MessageElement {
    title: string;
    subtitle?: string;
    image_url?: string;
    default_action?: Omit<WebUrlButton, 'title'>;
    buttons?: Button[];
  }

  export type OutgoingTextMessageData = { text: string };

  export type OutgoingQuickRepliesMessageData = OutgoingTextMessageData & {
    quick_replies: StdQuickReply[];
  };

  export type OutgoingButtonsMessageData = OutgoingTextMessageData & {
    buttons: Button[];
  };

  export type OutgoingFileMessageData = {
    quick_replies?: StdQuickReply[];
    type: FileType;
    url: string;
  };

  export type OutgoingCarouselMessageData = {
    elements: MessageElement[];
  };

  export type OutgoingListMessageData = OutgoingCarouselMessageData & {
    top_element_style?: 'large' | 'compact';
    buttons: Button[];
  };

  export type OutgoingMessageData =
    | OutgoingTextMessageData
    | OutgoingQuickRepliesMessageData
    | OutgoingButtonsMessageData
    | OutgoingFileMessageData
    | OutgoingCarouselMessageData
    | OutgoingListMessageData;

  export type OutgoingMessageBase =
    | {
        type: OutgoingMessageType.text;
        data: OutgoingTextMessageData;
      }
    | {
        type: OutgoingMessageType.quick_replies;
        data: OutgoingQuickRepliesMessageData;
      }
    | {
        type: OutgoingMessageType.buttons;
        data: OutgoingButtonsMessageData;
      }
    | {
        type: OutgoingMessageType.file;
        data: OutgoingFileMessageData;
      }
    | {
        type: OutgoingMessageType.carousel;
        data: OutgoingCarouselMessageData;
      }
    | {
        type: OutgoingMessageType.list;
        data: OutgoingListMessageData;
      };

  export type OutgoingMessage = OutgoingMessageBase & {
    mid: string;
    author: string;
    read?: boolean;
    createdAt: Date;
    handover: boolean;
  };

  export type Message = OutgoingMessage | IncomingMessage;
}
