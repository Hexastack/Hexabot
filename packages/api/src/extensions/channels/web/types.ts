/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { SubscriberFull } from '@/chat/dto/subscriber.dto';
import { FileType } from '@/chat/types/attachment';
import { Button, WebUrlButton } from '@/chat/types/button';
import { StdQuickReply } from '@/chat/types/quick-reply';

export namespace Web {
  export type RequestSession = {
    web?: {
      profile: SubscriberFull;
      threadId?: string;
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

  export const incomingEventMetadataSchema = z.strictObject({
    mid: z.string().optional(),
    author: z.string().optional(),
    thread_id: z.string().optional(),
    read: z.boolean().optional(),
    delivery: z.boolean().optional(),
    // Whether it's a synchronization
    // This is used when message sent by the chatbot from the client side
    sync: z.boolean().optional(),
    createdAt: z.date().optional(),
  });

  export type IncomingEventMetadata = z.infer<
    typeof incomingEventMetadataSchema
  >;

  export const incomingTextMessageDataSchema = z.strictObject({
    text: z.string(),
  });

  export type IncomingTextMessageData = z.infer<
    typeof incomingTextMessageDataSchema
  >;

  export const incomingPayloadMessageDataSchema = z.strictObject({
    text: z.string(),
    payload: z.string(), // Quick reply and button payload are the same
  });

  export type IncomingPayloadMessageData = z.infer<
    typeof incomingPayloadMessageDataSchema
  >;

  export const incomingLocationMessageDataSchema = z.strictObject({
    coordinates: z.strictObject({
      lat: z.number(),
      lng: z.number(),
    }),
  });

  export type IncomingLocationMessageData = z.infer<
    typeof incomingLocationMessageDataSchema
  >;

  export const incomingAttachmentHistoryMessageDataSchema = z.strictObject({
    type: z.enum(FileType),
    url: z.string(), // file download url
  });

  export const incomingAttachmentUploadMessageDataSchema = z.strictObject({
    type: z.string(), // mime type
    size: z.number(), // file size
    name: z.string(),
    file: z.instanceof(Buffer).optional(),
  });

  export const incomingAttachmentMessageDataSchema = z.union([
    incomingAttachmentHistoryMessageDataSchema,
    incomingAttachmentUploadMessageDataSchema,
  ]);

  export type IncomingAttachmentMessageData = z.infer<
    typeof incomingAttachmentMessageDataSchema
  >;

  export const incomingMessageDataSchema = z.union([
    incomingTextMessageDataSchema,
    incomingPayloadMessageDataSchema,
    incomingLocationMessageDataSchema,
    incomingAttachmentMessageDataSchema,
  ]);

  export type IncomingMessageData = z.infer<typeof incomingMessageDataSchema>;

  export const statusDeliveryEventSchema = z.strictObject({
    type: z.literal(StatusEventType.delivery),
    mid: z.string(),
  });

  export type StatusDeliveryEvent = z.infer<typeof statusDeliveryEventSchema>;

  export const statusReadEventSchema = z.strictObject({
    type: z.literal(StatusEventType.read),
    watermark: z.number(),
  });

  export type StatusReadEvent = z.infer<typeof statusReadEventSchema>;

  export const statusTypingEventSchema = z.strictObject({
    type: z.literal(StatusEventType.typing),
  });

  export type StatusTypingEvent = z.infer<typeof statusTypingEventSchema>;

  export const statusEventSchema = z.union([
    statusDeliveryEventSchema,
    statusReadEventSchema,
    statusTypingEventSchema,
  ]);

  export type StatusEvent = z.infer<typeof statusEventSchema>;

  export const incomingTextMessageSchema = z.strictObject({
    type: z.literal(IncomingMessageType.text),
    data: incomingTextMessageDataSchema,
    ...incomingEventMetadataSchema.shape,
  });

  export type IncomingTextMessage = z.infer<typeof incomingTextMessageSchema>;

  export const incomingPostbackMessageSchema = z.strictObject({
    type: z.literal(IncomingMessageType.postback),
    data: incomingPayloadMessageDataSchema,
    ...incomingEventMetadataSchema.shape,
  });

  export const incomingQuickReplyMessageSchema = z.strictObject({
    type: z.literal(IncomingMessageType.quick_reply),
    data: incomingPayloadMessageDataSchema,
    ...incomingEventMetadataSchema.shape,
  });

  export const incomingPayloadMessageSchema = z.union([
    incomingPostbackMessageSchema,
    incomingQuickReplyMessageSchema,
  ]);

  export type IncomingPayloadMessage = z.infer<
    typeof incomingPayloadMessageSchema
  >;

  export const incomingLocationMessageSchema = z.strictObject({
    type: z.literal(IncomingMessageType.location),
    data: incomingLocationMessageDataSchema,
    ...incomingEventMetadataSchema.shape,
  });

  export type IncomingLocationMessage = z.infer<
    typeof incomingLocationMessageSchema
  >;

  export const incomingAttachmentMessageSchema = z.strictObject({
    type: z.literal(IncomingMessageType.file),
    data: incomingAttachmentMessageDataSchema,
    ...incomingEventMetadataSchema.shape,
  });

  export type IncomingAttachmentMessage = z.infer<
    typeof incomingAttachmentMessageSchema
  >;

  export const incomingMessageBaseSchema = z.union([
    incomingTextMessageSchema,
    incomingPayloadMessageSchema,
    incomingLocationMessageSchema,
    incomingAttachmentMessageSchema,
  ]);

  export type IncomingMessageBase = z.infer<typeof incomingMessageBaseSchema>;

  export type IncomingMessage<
    T extends IncomingMessageBase = IncomingMessageBase,
  > = T;

  export const eventSchema = z.discriminatedUnion('type', [
    statusDeliveryEventSchema,
    statusReadEventSchema,
    statusTypingEventSchema,
    incomingTextMessageSchema,
    incomingPostbackMessageSchema,
    incomingQuickReplyMessageSchema,
    incomingLocationMessageSchema,
    incomingAttachmentMessageSchema,
  ]);

  export type Event = z.infer<typeof eventSchema>;

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
    thread_id?: string;
    read?: boolean;
    createdAt: Date;
    handover: boolean;
  };

  export type Message = OutgoingMessage | IncomingMessage;
}
