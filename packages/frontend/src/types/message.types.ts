/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType } from "@/services/types";

import { IAttachment } from "./attachment.types";
import { IBaseSchema, OmitPopulate } from "./base.types";
import { IContent } from "./content.types";
import { ISubscriber } from "./subscriber.types";
import { IUser } from "./user.types";

export enum OutgoingMessageFormat {
  text = "text",
  quickReplies = "quickReplies",
  buttons = "buttons",
  attachment = "attachment",
  list = "list",
  carousel = "carousel",
}

export enum PayloadType {
  location = "location",
  attachments = "attachments",
  menu = "menu",
  content = "content",
  quick_reply = "quick_reply",
  button = "button",
  outcome = "outcome",
}

export enum FileType {
  image = "image",
  video = "video",
  audio = "audio",
  file = "file",
  unknown = "unknown",
}

// Attachments
export interface IAttachmentAttrs {
  name: string;
  type: string;
  size: number;
  location: string;
  channel?: Record<string, any>;
  url?: string;
}

export type TAttachmentForeignKey = {
  id: string | null;
  /** @deprecated use id instead */
  url?: string;
};

export interface IAttachmentPayload {
  type: FileType;
  payload: TAttachmentForeignKey;
}

// Content
export interface ContentOptions {
  display: OutgoingMessageFormat.list | OutgoingMessageFormat.carousel;
  fields: {
    title: string;
    subtitle: string | null;
    image_url: string | null;
    url?: string;
    action_title?: string;
    action_payload?: string;
  };
  buttons: AnyButton[];
  limit: number;
  query?: any; // Waterline model criteria
  entity?: string | null; // ContentTypeID
  top_element_style?: "large" | "compact";
}

export enum ButtonType {
  postback = "postback",
  web_url = "web_url",
}

export type Payload =
  | {
      type: PayloadType.location;
      coordinates: {
        lat: number;
        lon: number;
      };
    }
  | {
      type: PayloadType.attachments;
      attachments: IAttachmentPayload;
    };

export enum QuickReplyType {
  text = "text",
  location = "location",
  // @TODO : The following are not in use anymore
  // user_phone_number = "user_phone_number",
  // user_email = "user_email",
}

export interface StdQuickReply {
  content_type: QuickReplyType;
  title?: string;
  payload?: string;
}

export type PostBackButton = {
  type: ButtonType.postback;
  title: string;
  payload: string;
};

export type WebviewHeightRatio = "compact" | "tall" | "full";

export type WebUrlButton = {
  type: ButtonType.web_url;
  title: string;
  url: string;
  messenger_extensions?: boolean;
  webview_height_ratio?: WebviewHeightRatio;
};

export type AnyButton = PostBackButton | WebUrlButton;

// Outgoing Messages

export type StdOutgoingTextMessage = { text: string };

export type StdOutgoingQuickRepliesMessage = {
  text: string;
  quickReplies: StdQuickReply[];
};

export type StdOutgoingButtonsMessage = {
  text: string;
  buttons: AnyButton[];
};

export interface OutgoingPopulatedListMessage {
  title: string;
  subtitle: string | null;
  image_url?: { payload: IAttachment; type: string } | null;
  url?: string;
  action_title?: string;
  action_payload?: string;
}

export type StdOutgoingListMessage = {
  options: ContentOptions;
  elements: IContent[];
  pagination: {
    total: number;
    skip: number;
    limit: number;
  };
};
export type StdOutgoingAttachmentMessage = {
  // Stored in DB as `AttachmentPayload`, `Attachment` when populated for channels relaying
  attachment: IAttachmentPayload;
  quickReplies?: StdQuickReply[];
};

// Incoming Messages

type StdIncomingTextMessage = { text: string };

export type StdIncomingPostBackMessage = StdIncomingTextMessage & {
  postback: string;
};

export type StdIncomingLocationMessage = {
  type: PayloadType.location;
  coordinates: {
    lat: number;
    lon: number;
  };
};

export type StdIncomingAttachmentMessage = {
  type: PayloadType.attachments;
  serialized_text: string;
  attachment: IAttachmentPayload | IAttachmentPayload[];
};

export type StdPluginMessage = {
  plugin: string;
  args: { [key: string]: any };
};

export type StdIncomingMessage =
  | StdIncomingTextMessage
  | StdIncomingPostBackMessage
  | StdIncomingLocationMessage
  | StdIncomingAttachmentMessage;

export type StdOutgoingMessage =
  | StdOutgoingTextMessage
  | StdOutgoingQuickRepliesMessage
  | StdOutgoingButtonsMessage
  | StdOutgoingListMessage
  | StdOutgoingAttachmentMessage;

export interface IMessageAttributes {
  mid?: string;
  inReplyTo?: string;
  sender?: string;
  recipient?: string;
  sentBy?: string;
  message: StdOutgoingMessage | StdIncomingMessage;
  read?: boolean;
  delivery?: boolean;
  handover?: boolean;
}

export interface IMessageFilters {}

export interface IMessageStub
  extends IBaseSchema,
    OmitPopulate<IMessageAttributes, EntityType.MESSAGE> {}

export interface IMessage extends IMessageStub {
  sender?: string;
  recipient?: string;
  sentBy?: string;
}

export interface IMessageFull extends IMessageStub {
  sender?: ISubscriber;
  recipient?: ISubscriber;
  sentBy?: IUser;
}
