/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { Content } from '@/cms/schemas/content.schema';

import {
  AttachmentForeignKey,
  AttachmentPayload,
  IncomingAttachmentPayload,
  WithUrl,
} from './attachment';
import { Button } from './button';
import { ContentOptions } from './options';
import { StdQuickReply } from './quick-reply';
import { Message } from '../message.schema';

/**
 * StdEventType enum is declared, and currently not used
 **/

export enum StdEventType {
  message = 'message',
  delivery = 'delivery',
  read = 'read',
  typing = 'typing',
  follow = 'follow',
  echo = 'echo',
  unknown = '',
}

/**
 * IncomingMessageType enum is declared, and currently not used
 **/
export enum IncomingMessageType {
  message = 'message',
  postback = 'postback',
  quick_reply = 'quick_reply',
  location = 'location',
  attachments = 'attachments',
  unknown = '',
}

export enum OutgoingMessageFormat {
  text = 'text',
  quickReplies = 'quickReplies',
  buttons = 'buttons',
  attachment = 'attachment',
  list = 'list',
  carousel = 'carousel',
}

/**
 * FileType enum is declared, and currently not used
 **/
export enum FileType {
  image = 'image',
  video = 'video',
  audio = 'audio',
  file = 'file',
  unknown = 'unknown',
}

export enum PayloadType {
  location = 'location',
  attachments = 'attachments',
}

export type StdOutgoingTextMessage = { text: string };

export type StdOutgoingQuickRepliesMessage = {
  text: string;
  quickReplies: StdQuickReply[];
};

export type StdOutgoingButtonsMessage = {
  text: string;
  buttons: Button[];
};

export type StdOutgoingListMessage = {
  options: ContentOptions;
  elements: Content[];
  pagination: {
    total: number;
    skip: number;
    limit: number;
  };
};

export type StdOutgoingAttachmentMessage<
  A extends WithUrl<Attachment> | AttachmentForeignKey,
> = {
  // Stored in DB as `AttachmentPayload`, `Attachment` when populated for channels relaying
  attachment: AttachmentPayload<A>;
  quickReplies?: StdQuickReply[];
};

export type StdPluginMessage = {
  plugin: string;
  args: { [key: string]: any };
};

export type BlockMessage =
  | string[]
  | StdOutgoingTextMessage
  | StdOutgoingQuickRepliesMessage
  | StdOutgoingButtonsMessage
  | StdOutgoingListMessage
  | StdOutgoingAttachmentMessage<AttachmentForeignKey>
  | StdPluginMessage;

export type StdOutgoingMessage =
  | StdOutgoingTextMessage
  | StdOutgoingQuickRepliesMessage
  | StdOutgoingButtonsMessage
  | StdOutgoingListMessage
  | StdOutgoingAttachmentMessage<WithUrl<Attachment>>;

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
  attachment: IncomingAttachmentPayload | IncomingAttachmentPayload[];
};

export type StdIncomingMessage =
  | StdIncomingTextMessage
  | StdIncomingPostBackMessage
  | StdIncomingLocationMessage
  | StdIncomingAttachmentMessage;

export interface IncomingMessage extends Omit<Message, 'recipient' | 'sentBy'> {
  message: StdIncomingMessage;
  sender: string;
}

export interface OutgoingMessage extends Omit<Message, 'sender'> {
  message: StdOutgoingMessage;
  recipient: string;
  sentBy?: string;
  handover?: boolean;
}

export type AnyMessage = IncomingMessage | OutgoingMessage;

export interface StdOutgoingTextEnvelope {
  format: OutgoingMessageFormat.text;
  message: StdOutgoingTextMessage;
}

export interface StdOutgoingQuickRepliesEnvelope {
  format: OutgoingMessageFormat.quickReplies;
  message: StdOutgoingQuickRepliesMessage;
}

export interface StdOutgoingButtonsEnvelope {
  format: OutgoingMessageFormat.buttons;
  message: StdOutgoingButtonsMessage;
}

export interface StdOutgoingListEnvelope {
  format: OutgoingMessageFormat.list | OutgoingMessageFormat.carousel;
  message: StdOutgoingListMessage;
}

export interface StdOutgoingAttachmentEnvelope {
  format: OutgoingMessageFormat.attachment;
  message: StdOutgoingAttachmentMessage<WithUrl<Attachment>>;
}

export type StdOutgoingEnvelope =
  | StdOutgoingTextEnvelope
  | StdOutgoingQuickRepliesEnvelope
  | StdOutgoingButtonsEnvelope
  | StdOutgoingListEnvelope
  | StdOutgoingAttachmentEnvelope;
