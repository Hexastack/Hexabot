/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { SocketIoClientError } from "../utils/SocketIoClientError";

export enum Direction {
  sent = "sent",
  received = "received",
}

export enum QuickReplyType {
  text = "text",
  location = "location",
}

export interface IQuickReply {
  title?: string;
  payload?: string;
}

export interface IPayload {
  text?: string;
  payload?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export enum FileType {
  image = "image",
  video = "video",
  audio = "audio",
  file = "file",
  unknkown = "unknown",
}

export interface ISubscriber {
  id: string;
  first_name: string;
  last_name: string;
  locale: string;
  gender: string;
  assignedAt?: Date | null;
  lastvisit?: Date;
  retainedFrom?: Date;
  channel: TChannelData;
  timezone?: number;
  language: string;
  country?: string;
  foreign_id: string;
}

export enum ButtonType {
  postback = "postback",
  web_url = "web_url",
}

export type TPostBackButton = {
  type: ButtonType.postback;
  title: string;
  payload: string;
};

export type TWebUrlButton = {
  type: ButtonType.web_url;
  title: string;
  url: string;
  messenger_extensions?: boolean;
  webview_height_ratio?: "compact" | "tall" | "full";
};

export type TButton = TPostBackButton | TWebUrlButton;

export type TChannelData = {
  isSocket: boolean;
  ipAddress: string;
  agent: string;
};

export type TRequestSession = {
  web?: {
    profile: ISubscriber;
    isSocket: boolean;
    // @TODO : not sure why we added messageQuery (long pooling ?)
    messageQueue: never[];
    polling: boolean;
  };
};

export enum TStatusEventType {
  delivery = "delivery",
  read = "read",
  typing = "typing",
}

export enum TOutgoingMessageType {
  text = "text",
  quick_reply = "quick_reply",
  postback = "postback",
  location = "location",
  file = "file",
}

export type TEventType = TStatusEventType | TOutgoingMessageType;

export enum IncomingMessageType {
  text = "text",
  buttons = "buttons",
  quick_replies = "quick_replies",
  file = "file",
  list = "list",
  carousel = "carousel",
}

export type TOutgoingTextMessageData = { text: string };

export type TOutgoingPayloadMessageData = TOutgoingTextMessageData & {
  payload: string; // Quick reply and button payload are the same
};

export type TOutgoingLocationMessageData = {
  coordinates: {
    lat: number;
    lng: number;
  };
};

export type TOutgoingAttachmentMessageData = {
  type: string; // mime type in a file case
  url?: string; // file url
  // Only when uploaded
  size?: number; // file size
  name?: string;
  file?: File;
};

export type TOutgoingMessageData =
  | TOutgoingTextMessageData
  | TOutgoingPayloadMessageData
  | TOutgoingLocationMessageData
  | TOutgoingAttachmentMessageData;

export type TStatusDeliveryEvent = {
  type: TStatusEventType.delivery;
  mid: string;
};

export type TStatusReadEvent = {
  type: TStatusEventType.read;
  watermark: number;
};

export type TStatusTypingEvent = {
  type: TStatusEventType.typing;
};

export type TStatusEvent =
  | TStatusDeliveryEvent
  | TStatusReadEvent
  | TStatusTypingEvent;

export type TOutgoingTextMessage = {
  type: TOutgoingMessageType.text;
  data: TOutgoingTextMessageData;
};

export type TOutgoingPayloadMessage = {
  type: TOutgoingMessageType.postback | TOutgoingMessageType.quick_reply;
  data: TOutgoingPayloadMessageData;
};

export type TOutgoingLocationMessage = {
  type: TOutgoingMessageType.location;
  data: TOutgoingLocationMessageData;
};

export type TOutgoingAttachmentMessage = {
  type: TOutgoingMessageType.file;
  data: TOutgoingAttachmentMessageData;
};

export type TOutgoingMessageBase =
  | TOutgoingTextMessage
  | TOutgoingPayloadMessage
  | TOutgoingLocationMessage
  | TOutgoingAttachmentMessage;

export type TOutgoingMessage<
  T =
    | TOutgoingTextMessage
    | TOutgoingPayloadMessage
    | TOutgoingLocationMessage
    | TOutgoingAttachmentMessage,
> = T & {
  mid?: string;
  author?: string;
  read?: boolean;
  delivery?: boolean;
  // Whether it's a synchronization
  // This is used when message sent by the chatbot from the client side
  sync?: boolean;
  createdAt: string;
  direction: Direction.sent;
};

export type TEvent = TIncomingMessage | TOutgoingMessage | TStatusEvent;

export interface IMessageElement {
  title: string;
  subtitle?: string;
  image_url?: string;
  default_action?: Omit<TWebUrlButton, "title">;
  buttons?: TButton[];
}

export type TIncomingTextMessageData = { text: string };

export type TIncomingQuickRepliesMessageData = TIncomingTextMessageData & {
  quick_replies: IQuickReply[];
};

export type TIncomingButtonsMessageData = TIncomingTextMessageData & {
  buttons: TButton[];
};

export type TIncomingFileMessageData = {
  quick_replies?: IQuickReply[];
  type: FileType;
  url: string;
};

export type TIncomingCarouselMessageData = {
  elements: IMessageElement[];
};

export type TIncomingListMessageData = TIncomingCarouselMessageData & {
  top_element_style?: "large" | "compact";
  buttons: TButton[];
};

export type TIncomingMessageData =
  | TIncomingTextMessageData
  | TIncomingQuickRepliesMessageData
  | TIncomingButtonsMessageData
  | TIncomingFileMessageData
  | TIncomingCarouselMessageData
  | TIncomingListMessageData;

export type TIncomingMessageBase =
  | {
      type: IncomingMessageType.text;
      data: TIncomingTextMessageData;
    }
  | {
      type: IncomingMessageType.quick_replies;
      data: TIncomingQuickRepliesMessageData;
    }
  | {
      type: IncomingMessageType.buttons;
      data: TIncomingButtonsMessageData;
    }
  | {
      type: IncomingMessageType.file;
      data: TIncomingFileMessageData;
    }
  | {
      type: IncomingMessageType.carousel;
      data: TIncomingCarouselMessageData;
    }
  | {
      type: IncomingMessageType.list;
      data: TIncomingListMessageData;
    };

export type TIncomingMessage = TIncomingMessageBase & {
  mid: string;
  author: string;
  read?: boolean;
  delivery?: boolean;
  createdAt: string;
  handover: boolean;
  direction: Direction.received;
};

export type TMessage = TIncomingMessage | TOutgoingMessage;

export interface ISuggestion {
  text: string;
  payload: string;
}

export type TPostMessageEvent<
  T =
    | TOutgoingTextMessage
    | TOutgoingPayloadMessage
    | TOutgoingLocationMessage
    | TOutgoingAttachmentMessage,
> = T & {
  author?: string;
};

export interface SubscribeResponse {
  messages: TMessage[];
  profile: ISubscriber;
}

export interface SocketErrorResponse {
  message: string;
  statusCode: number;
}

export type SocketErrorHandlers = Record<
  string,
  (err: SocketIoClientError) => Promise<void> | void
>;
