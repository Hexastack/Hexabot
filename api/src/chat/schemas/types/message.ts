/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

import { PluginName } from '@/plugins/types';

import { Message } from '../message.schema';

import { attachmentPayloadSchema } from './attachment';
import { buttonSchema } from './button';
import { contentOptionsSchema } from './options';
import { QuickReplyType, stdQuickReplySchema } from './quick-reply';

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

export const incomingMessageType = z.nativeEnum(IncomingMessageType);

export type IncomingMessageTypeLiteral = z.infer<typeof incomingMessageType>;

export enum OutgoingMessageFormat {
  text = 'text',
  quickReplies = 'quickReplies',
  buttons = 'buttons',
  attachment = 'attachment',
  list = 'list',
  carousel = 'carousel',
}

export const outgoingMessageFormatSchema = z.nativeEnum(OutgoingMessageFormat);

export type OutgoingMessageFormatLiteral = z.infer<
  typeof outgoingMessageFormatSchema
>;

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

export const fileTypeSchema = z.nativeEnum(FileType);

export type FileTypeLiteral = z.infer<typeof fileTypeSchema>;

export enum PayloadType {
  location = 'location',
  attachments = 'attachments',
  quick_reply = 'quick_reply',
  button = 'button',
}

export const payloadTypeSchema = z.nativeEnum(PayloadType);

export type PayloadTypeLiteral = z.infer<typeof payloadTypeSchema>;

export const stdOutgoingTextMessageSchema = z.object({
  text: z.string(),
});

export type StdOutgoingTextMessage = z.infer<
  typeof stdOutgoingTextMessageSchema
>;

export const stdOutgoingQuickRepliesMessageSchema = z.object({
  text: z.string(),
  quickReplies: z.array(stdQuickReplySchema),
});

export type StdOutgoingQuickRepliesMessage = z.infer<
  typeof stdOutgoingQuickRepliesMessageSchema
>;

export const stdOutgoingButtonsMessageSchema = z.object({
  text: z.string(),
  buttons: z.array(buttonSchema),
});

export type StdOutgoingButtonsMessage = z.infer<
  typeof stdOutgoingButtonsMessageSchema
>;

export const contentElementSchema = z
  .object({
    id: z.string(),
    title: z.string(),
  })
  .catchall(z.any());

export type ContentElement = z.infer<typeof contentElementSchema>;

export const stdOutgoingListMessageSchema = z.object({
  options: contentOptionsSchema,
  elements: z.array(contentElementSchema),
  pagination: z.object({
    total: z.number(),
    skip: z.number(),
    limit: z.number(),
  }),
});

export type StdOutgoingListMessage = z.infer<
  typeof stdOutgoingListMessageSchema
>;

export const stdOutgoingAttachmentMessageSchema = z.object({
  attachment: attachmentPayloadSchema,
  quickReplies: z.array(stdQuickReplySchema).optional(),
});

export type StdOutgoingAttachmentMessage = z.infer<
  typeof stdOutgoingAttachmentMessageSchema
>;

export const pluginNameSchema = z.object({
  name: z.string().regex(/-plugin$/) as z.ZodType<PluginName>,
});

export const stdPluginMessageSchema = z.object({
  plugin: pluginNameSchema,
  args: z.record(z.any()),
});

export type StdPluginMessage = z.infer<typeof stdPluginMessageSchema>;

export const BlockMessageSchema = z.union([
  z.array(z.string()),
  stdOutgoingTextMessageSchema,
  stdOutgoingQuickRepliesMessageSchema,
  stdOutgoingButtonsMessageSchema,
  stdOutgoingListMessageSchema,
  stdOutgoingAttachmentMessageSchema,
  stdPluginMessageSchema,
]);

export type BlockMessage = z.infer<typeof BlockMessageSchema>;

export const StdOutgoingMessageSchema = z.union([
  stdOutgoingTextMessageSchema,
  stdOutgoingQuickRepliesMessageSchema,
  stdOutgoingButtonsMessageSchema,
  stdOutgoingListMessageSchema,
  stdOutgoingAttachmentMessageSchema,
]);

export type StdOutgoingMessage = z.infer<typeof StdOutgoingMessageSchema>;

export const stdIncomingTextMessageSchema = z.object({
  text: z.string(),
});

export type StdIncomingTextMessage = z.infer<
  typeof stdIncomingTextMessageSchema
>;

export const stdIncomingPostBackMessageSchema =
  stdIncomingTextMessageSchema.extend({
    postback: z.string(),
  });

export type StdIncomingPostBackMessage = z.infer<
  typeof stdIncomingPostBackMessageSchema
>;

export const stdIncomingLocationMessageSchema = z.object({
  type: z.literal(PayloadType.location),
  coordinates: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
});

export type StdIncomingLocationMessage = z.infer<
  typeof stdIncomingLocationMessageSchema
>;

export const stdIncomingAttachmentMessageSchema = z.object({
  type: z.literal(PayloadType.attachments),
  serialized_text: z.string(),
  attachment: z.union([
    attachmentPayloadSchema,
    z.array(attachmentPayloadSchema),
  ]),
});

export type StdIncomingAttachmentMessage = z.infer<
  typeof stdIncomingAttachmentMessageSchema
>;

export const stdIncomingMessageSchema = z.union([
  stdIncomingTextMessageSchema,
  stdIncomingPostBackMessageSchema,
  stdIncomingLocationMessageSchema,
  stdIncomingAttachmentMessageSchema,
]);

export type StdIncomingMessage = z.infer<typeof stdIncomingMessageSchema>;

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

export const stdOutgoingTextEnvelopeSchema = z.object({
  format: z.literal(OutgoingMessageFormat.text),
  message: stdOutgoingTextMessageSchema,
});

export type StdOutgoingTextEnvelope = z.infer<
  typeof stdOutgoingTextEnvelopeSchema
>;

export const stdOutgoingQuickRepliesEnvelopeSchema = z.object({
  format: z.literal(OutgoingMessageFormat.quickReplies),
  message: stdOutgoingQuickRepliesMessageSchema,
});

export type StdOutgoingQuickRepliesEnvelope = z.infer<
  typeof stdOutgoingQuickRepliesEnvelopeSchema
>;

export const stdOutgoingButtonsEnvelopeSchema = z.object({
  format: z.literal(OutgoingMessageFormat.buttons),
  message: stdOutgoingButtonsMessageSchema,
});

export type StdOutgoingButtonsEnvelope = z.infer<
  typeof stdOutgoingButtonsEnvelopeSchema
>;

export const stdOutgoingListEnvelopeSchema = z.object({
  format: z.union([
    z.literal(OutgoingMessageFormat.list),
    z.literal(OutgoingMessageFormat.carousel),
  ]),
  message: stdOutgoingListMessageSchema,
});

export type StdOutgoingListEnvelope = z.infer<
  typeof stdOutgoingListEnvelopeSchema
>;

export const stdOutgoingAttachmentEnvelopeSchema = z.object({
  format: z.literal(OutgoingMessageFormat.attachment),
  message: stdOutgoingAttachmentMessageSchema,
});

export type StdOutgoingAttachmentEnvelope = z.infer<
  typeof stdOutgoingAttachmentEnvelopeSchema
>;

export const stdOutgoingEnvelopeSchema = z.union([
  stdOutgoingTextEnvelopeSchema,
  stdOutgoingQuickRepliesEnvelopeSchema,
  stdOutgoingButtonsEnvelopeSchema,
  stdOutgoingListEnvelopeSchema,
  stdOutgoingAttachmentEnvelopeSchema,
]);

export type StdOutgoingEnvelope = z.infer<typeof stdOutgoingEnvelopeSchema>;

// is-valid-message-text validation
export const validMessageTextSchema = z.object({
  message: z.string(),
});

// is-message validation
const MESSAGE_REGEX = /^function \(context\) \{[^]+\}/;

export const messageRegexSchema = z.string().regex(MESSAGE_REGEX);

export const textSchema = z.array(z.string().max(1000));

const quickReplySchema = z
  .object({
    content_type: z.nativeEnum(QuickReplyType),
    title: z.string().max(20).optional(),
    payload: z.string().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    // When content_type is 'text', title and payload are required.
    if (data.content_type === QuickReplyType.text) {
      if (data.title == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Title is required when content_type is 'text'",
          path: ['title'],
        });
      }
      if (data.payload == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Payload is required when content_type is 'text'",
          path: ['payload'],
        });
      }
    }
  });

// BlockMessage Schema
export const blockMessageObjectSchema = z.object({
  text: z.string().max(1000).optional(),
  attachment: z
    .object({
      type: z.nativeEnum(FileType),
      payload: z
        .union([
          z.object({ url: z.string().url() }),
          z.object({ id: z.string().nullable() }),
        ])
        .optional(),
    })
    .optional(),
  elements: z.boolean().optional(),
  cards: z
    .object({
      default_action: buttonSchema,
      buttons: z.array(buttonSchema).max(3),
    })
    .optional(),
  buttons: z.array(buttonSchema).max(3).optional(),
  quickReplies: z.array(quickReplySchema).max(11).optional(),
});
