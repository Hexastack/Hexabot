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
import { buttonSchema, PayloadType } from './button';
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
  error = 'error',
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
  system = 'system',
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

export const contentPaginationSchema = z.object({
  total: z.number(),
  skip: z.number(),
  limit: z.number(),
});

export type ContentPagination = z.infer<typeof contentPaginationSchema>;

export const stdOutgoingListMessageSchema = z.object({
  options: contentOptionsSchema,
  elements: z.array(contentElementSchema),
  pagination: contentPaginationSchema,
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

export const stdOutgoingSystemMessageSchema = z.object({
  outcome: z.string().optional(), // "any" or any other string (in snake case)
  data: z.any().optional(),
});

export type StdOutgoingSystemMessage = z.infer<
  typeof stdOutgoingSystemMessageSchema
>;

export const pluginNameSchema = z
  .string()
  .regex(/-plugin$/) as z.ZodType<PluginName>;

export const stdPluginMessageSchema = z.object({
  plugin: pluginNameSchema,
  args: z.record(z.any()),
});

export type StdPluginMessage = z.infer<typeof stdPluginMessageSchema>;

export const blockMessageSchema = z.union([
  z.array(z.string()),
  stdOutgoingTextMessageSchema,
  stdOutgoingQuickRepliesMessageSchema,
  stdOutgoingButtonsMessageSchema,
  stdOutgoingListMessageSchema,
  stdOutgoingAttachmentMessageSchema,
  stdPluginMessageSchema,
]);

export type BlockMessage = z.infer<typeof blockMessageSchema>;

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
  format: z.enum(['list', 'carousel']),
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

export const stdOutgoingSystemEnvelopeSchema = z.object({
  format: z.literal(OutgoingMessageFormat.system),
  message: stdOutgoingSystemMessageSchema,
});

export type StdOutgoingSystemEnvelope = z.infer<
  typeof stdOutgoingSystemEnvelopeSchema
>;

export const stdOutgoingMessageEnvelopeSchema = z.union([
  stdOutgoingTextEnvelopeSchema,
  stdOutgoingQuickRepliesEnvelopeSchema,
  stdOutgoingButtonsEnvelopeSchema,
  stdOutgoingListEnvelopeSchema,
  stdOutgoingAttachmentEnvelopeSchema,
]);

export type StdOutgoingMessageEnvelope = z.infer<
  typeof stdOutgoingMessageEnvelopeSchema
>;

export const stdOutgoingEnvelopeSchema = z.union([
  stdOutgoingMessageEnvelopeSchema,
  stdOutgoingSystemEnvelopeSchema,
]);

export type StdOutgoingEnvelope = z.infer<typeof stdOutgoingEnvelopeSchema>;

// is-valid-message-text validation
export const validMessageTextSchema = z.object({
  text: z.string(),
});

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

// pluginBlockMessageSchema in case of Plugin Block
export const pluginBlockMessageSchema = z
  .record(z.any())
  .superRefine((data, ctx) => {
    if (!('plugin' in data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The object must contain the 'plugin' attribute",
        path: ['plugin'],
      });
    }
  });

// textBlockMessageSchema in case of Text Block
const textBlockMessageSchema = z.string().max(1000);

const buttonMessageSchema = z.object({
  text: z.string(),
  buttons: z.array(buttonSchema).max(3),
});

// quickReplyMessageSchema in case of QuickReply Block
const quickReplyMessageSchema = z.object({
  text: z.string(),
  quickReplies: z.array(quickReplySchema).max(11).optional(),
});

// listBlockMessageSchema in case of List Block
const listBlockMessageSchema = z.object({
  elements: z.boolean(),
});

// attachmentBlockMessageSchema in case of Attachment Block
const attachmentBlockMessageSchema = z.object({
  text: z.string().max(1000).optional(),
  attachment: z.object({
    type: z.nativeEnum(FileType),
    payload: z.union([
      z.object({ url: z.string().url() }),
      z.object({ id: z.string().nullable() }),
    ]),
  }),
});

// BlockMessage Schema
export const blockMessageObjectSchema = z.union([
  textSchema,
  textBlockMessageSchema,
  buttonMessageSchema,
  quickReplyMessageSchema,
  listBlockMessageSchema,
  attachmentBlockMessageSchema,
  pluginBlockMessageSchema,
]);
