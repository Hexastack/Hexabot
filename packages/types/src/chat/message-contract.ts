/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import type { Attachment } from "../attachment/attachment";

import { attachmentPayloadSchema } from "./attachment";
import { PayloadType, buttonSchema } from "./button";
import type { Message as EntityMessage } from "./message";
import { contentOptionsSchema } from "./options";
import { stdQuickReplySchema } from "./quick-reply";

export enum StdEventType {
  message = "message",
  delivery = "delivery",
  read = "read",
  typing = "typing",
  follow = "follow",
  echo = "echo",
  error = "error",
  unknown = "",
}

export enum IncomingMessageType {
  text = "text",
  postback = "postback",
  quickReply = "quickReply",
  location = "location",
  attachment = "attachment",
  unknown = "",
}

export const incomingMessageType = z.enum(IncomingMessageType);

export type IncomingMessageTypeLiteral = z.infer<typeof incomingMessageType>;

export enum OutgoingMessageType {
  text = "text",
  quickReply = "quickReply",
  buttons = "buttons",
  attachment = "attachment",
  list = "list",
  carousel = "carousel",
  system = "system",
}

export const outgoingMessageTypeSchema = z.enum(OutgoingMessageType);

export type OutgoingMessageTypeLiteral = z.infer<
  typeof outgoingMessageTypeSchema
>;

export const payloadTypeSchema = z.enum(PayloadType);

export type PayloadTypeLiteral = z.infer<typeof payloadTypeSchema>;

export const stdOutgoingTextMessageDataSchema = z.object({
  text: z.string(),
});

export type StdOutgoingTextMessageData = z.infer<
  typeof stdOutgoingTextMessageDataSchema
>;

export const stdOutgoingQuickRepliesMessageDataSchema = z.object({
  text: z.string(),
  quickReplies: z.array(stdQuickReplySchema),
});

export type StdOutgoingQuickRepliesMessageData = z.infer<
  typeof stdOutgoingQuickRepliesMessageDataSchema
>;

export const stdOutgoingButtonsMessageDataSchema = z.object({
  text: z.string(),
  buttons: z.array(buttonSchema),
});

export type StdOutgoingButtonsMessageData = z.infer<
  typeof stdOutgoingButtonsMessageDataSchema
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

export const stdOutgoingListMessageDataSchema = z.object({
  options: contentOptionsSchema,
  elements: z.array(contentElementSchema),
  pagination: contentPaginationSchema,
});

export type StdOutgoingListMessageData = z.infer<
  typeof stdOutgoingListMessageDataSchema
>;

export interface OutgoingPopulatedListMessage {
  title: string;
  subtitle: string | null;
  image_url?: { payload: Attachment; type: string } | null;
  url?: string;
  action_title?: string;
  action_payload?: string;
}

export const stdOutgoingAttachmentMessageDataSchema = z.object({
  attachment: attachmentPayloadSchema,
  quickReplies: z.array(stdQuickReplySchema).optional(),
});

export type StdOutgoingAttachmentMessageData = z.infer<
  typeof stdOutgoingAttachmentMessageDataSchema
>;

export const stdOutgoingSystemMessageDataSchema = z.object({
  outcome: z.string().optional(),
  data: z.any().optional(),
});

export type StdOutgoingSystemMessageData = z.infer<
  typeof stdOutgoingSystemMessageDataSchema
>;

export const stdOutgoingTextMessageSchema = z.object({
  type: z.literal(OutgoingMessageType.text),
  data: stdOutgoingTextMessageDataSchema,
});

export type StdOutgoingTextMessage = z.infer<
  typeof stdOutgoingTextMessageSchema
>;

export const stdOutgoingQuickRepliesMessageSchema = z.object({
  type: z.literal(OutgoingMessageType.quickReply),
  data: stdOutgoingQuickRepliesMessageDataSchema,
});

export type StdOutgoingQuickRepliesMessage = z.infer<
  typeof stdOutgoingQuickRepliesMessageSchema
>;

export const stdOutgoingButtonsMessageSchema = z.object({
  type: z.literal(OutgoingMessageType.buttons),
  data: stdOutgoingButtonsMessageDataSchema,
});

export type StdOutgoingButtonsMessage = z.infer<
  typeof stdOutgoingButtonsMessageSchema
>;

export const stdOutgoingListMessageSchema = z.object({
  type: z.literal(OutgoingMessageType.list),
  data: stdOutgoingListMessageDataSchema,
});

export type StdOutgoingListMessage = z.infer<
  typeof stdOutgoingListMessageSchema
>;

export const stdOutgoingCarouselMessageSchema = z.object({
  type: z.literal(OutgoingMessageType.carousel),
  data: stdOutgoingListMessageDataSchema,
});

export type StdOutgoingCarouselMessage = z.infer<
  typeof stdOutgoingCarouselMessageSchema
>;

export const stdOutgoingAttachmentMessageSchema = z.object({
  type: z.literal(OutgoingMessageType.attachment),
  data: stdOutgoingAttachmentMessageDataSchema,
});

export type StdOutgoingAttachmentMessage = z.infer<
  typeof stdOutgoingAttachmentMessageSchema
>;

export const stdOutgoingMessageSchema = z.discriminatedUnion("type", [
  stdOutgoingTextMessageSchema,
  stdOutgoingQuickRepliesMessageSchema,
  stdOutgoingButtonsMessageSchema,
  stdOutgoingListMessageSchema,
  stdOutgoingCarouselMessageSchema,
  stdOutgoingAttachmentMessageSchema,
]);

export type StdOutgoingMessage = z.infer<typeof stdOutgoingMessageSchema>;

export const stdIncomingTextMessageDataSchema = z.object({
  text: z.string(),
});

export type StdIncomingTextMessageData = z.infer<
  typeof stdIncomingTextMessageDataSchema
>;

export const stdIncomingPayloadMessageDataSchema = z.object({
  text: z.string(),
  payload: z.string(),
});

export type StdIncomingPayloadMessageData = z.infer<
  typeof stdIncomingPayloadMessageDataSchema
>;

export const stdIncomingLocationMessageDataSchema = z.object({
  coordinates: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
});

export type StdIncomingLocationMessageData = z.infer<
  typeof stdIncomingLocationMessageDataSchema
>;

export const stdIncomingAttachmentMessageDataSchema = z.object({
  serializedText: z.string(),
  attachment: z.union([
    attachmentPayloadSchema,
    z.array(attachmentPayloadSchema),
  ]),
});

export type StdIncomingAttachmentMessageData = z.infer<
  typeof stdIncomingAttachmentMessageDataSchema
>;

export const stdIncomingTextMessageSchema = z.object({
  type: z.literal(IncomingMessageType.text),
  data: stdIncomingTextMessageDataSchema,
});

export type StdIncomingTextMessage = z.infer<
  typeof stdIncomingTextMessageSchema
>;

export const stdIncomingPostBackMessageSchema = z.object({
  type: z.literal(IncomingMessageType.postback),
  data: stdIncomingPayloadMessageDataSchema,
});

export type StdIncomingPostBackMessage = z.infer<
  typeof stdIncomingPostBackMessageSchema
>;

export const stdIncomingQuickReplyMessageSchema = z.object({
  type: z.literal(IncomingMessageType.quickReply),
  data: stdIncomingPayloadMessageDataSchema,
});

export type StdIncomingQuickReplyMessage = z.infer<
  typeof stdIncomingQuickReplyMessageSchema
>;

export const stdIncomingLocationMessageSchema = z.object({
  type: z.literal(IncomingMessageType.location),
  data: stdIncomingLocationMessageDataSchema,
});

export type StdIncomingLocationMessage = z.infer<
  typeof stdIncomingLocationMessageSchema
>;

export const stdIncomingAttachmentMessageSchema = z.object({
  type: z.literal(IncomingMessageType.attachment),
  data: stdIncomingAttachmentMessageDataSchema,
});

export type StdIncomingAttachmentMessage = z.infer<
  typeof stdIncomingAttachmentMessageSchema
>;

export const stdIncomingMessageSchema = z.discriminatedUnion("type", [
  stdIncomingTextMessageSchema,
  stdIncomingPostBackMessageSchema,
  stdIncomingQuickReplyMessageSchema,
  stdIncomingLocationMessageSchema,
  stdIncomingAttachmentMessageSchema,
]);

export type StdIncomingMessage = z.infer<typeof stdIncomingMessageSchema>;

export interface IncomingMessage
  extends Omit<EntityMessage, "recipient" | "sentBy"> {
  message: StdIncomingMessage;
  sender: string;
}

export interface OutgoingMessage extends Omit<EntityMessage, "sender"> {
  message: StdOutgoingMessage;
  recipient: string;
  sentBy?: string;
  handover: boolean;
}

export type AnyMessage = IncomingMessage | OutgoingMessage;

export const stdOutgoingTextEnvelopeSchema = stdOutgoingTextMessageSchema;

export type StdOutgoingTextEnvelope = StdOutgoingTextMessage;

export const stdOutgoingQuickRepliesEnvelopeSchema =
  stdOutgoingQuickRepliesMessageSchema;

export type StdOutgoingQuickRepliesEnvelope = StdOutgoingQuickRepliesMessage;

export const stdOutgoingButtonsEnvelopeSchema = stdOutgoingButtonsMessageSchema;

export type StdOutgoingButtonsEnvelope = StdOutgoingButtonsMessage;

export const stdOutgoingListEnvelopeSchema = z.discriminatedUnion("type", [
  stdOutgoingListMessageSchema,
  stdOutgoingCarouselMessageSchema,
]);

export type StdOutgoingListEnvelope = z.infer<
  typeof stdOutgoingListEnvelopeSchema
>;

export const stdOutgoingAttachmentEnvelopeSchema =
  stdOutgoingAttachmentMessageSchema;

export type StdOutgoingAttachmentEnvelope = StdOutgoingAttachmentMessage;

export const stdOutgoingSystemMessageSchema = z.object({
  type: z.literal(OutgoingMessageType.system),
  data: stdOutgoingSystemMessageDataSchema,
});

export type StdOutgoingSystemMessage = z.infer<
  typeof stdOutgoingSystemMessageSchema
>;

export const stdOutgoingSystemEnvelopeSchema = stdOutgoingSystemMessageSchema;

export type StdOutgoingSystemEnvelope = StdOutgoingSystemMessage;

export const stdOutgoingMessageEnvelopeSchema = stdOutgoingMessageSchema;

export type StdOutgoingMessageEnvelope = StdOutgoingMessage;

export const stdOutgoingEnvelopeSchema = z.discriminatedUnion("type", [
  stdOutgoingTextMessageSchema,
  stdOutgoingQuickRepliesMessageSchema,
  stdOutgoingButtonsMessageSchema,
  stdOutgoingListMessageSchema,
  stdOutgoingCarouselMessageSchema,
  stdOutgoingAttachmentMessageSchema,
  stdOutgoingSystemMessageSchema,
]);

export type StdOutgoingEnvelope = z.infer<typeof stdOutgoingEnvelopeSchema>;
