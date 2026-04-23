/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { Attachment, Content as SharedContent } from "@hexabot-ai/types";

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

export interface StdQuickReply {
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
  image_url?: { payload: Attachment; type: string } | null;
  url?: string;
  action_title?: string;
  action_payload?: string;
}

export type StdOutgoingListMessage = {
  options: ContentOptions;
  elements: SharedContent[];
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
