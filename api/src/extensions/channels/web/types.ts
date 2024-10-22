/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { SubscriberFull } from '@/chat/schemas/subscriber.schema';
import { Button, WebUrlButton } from '@/chat/schemas/types/button';
import { FileType } from '@/chat/schemas/types/message';
import { StdQuickReply } from '@/chat/schemas/types/quick-reply';

export namespace Web {
  export enum SettingLabel {
    secret = 'secret',
    verification_token = 'verification_token',
    allowed_domains = 'allowed_domains',
    start_button = 'start_button',
    input_disabled = 'input_disabled',
    persistent_menu = 'persistent_menu',
    greeting_message = 'greeting_message',
    theme_color = 'theme_color',
    window_title = 'window_title',
    avatar_url = 'avatar_url',
    show_emoji = 'show_emoji',
    show_file = 'show_file',
    show_location = 'show_location',
    allowed_upload_size = 'allowed_upload_size',
    allowed_upload_types = 'allowed_upload_types',
  }

  export type Settings = Record<SettingLabel, any>;

  export type ChannelData = {
    isSocket: boolean;
    ipAddress: string;
    agent: string;
  };

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

  export type IncomingAttachmentMessageData = {
    type: FileType; // mime type in a file case
    url: string; // file url
    // Only when uploaded
    size?: number; // file size
    name?: string;
    file?: any;
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
