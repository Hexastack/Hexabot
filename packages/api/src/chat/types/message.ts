/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { Message } from '../dto/message.dto';

import { attachmentPayloadSchema } from './attachment';
import { buttonSchema, PayloadType } from './button';
import { contentOptionsSchema } from './options';
import { stdQuickReplySchema } from './quick-reply';

/**
 * StdEventType enum is declared, and currently not used
 */

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
 */
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
  handover: boolean;
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
