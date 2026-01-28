/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { attachmentPayloadSchema } from './attachment';
import { PayloadType } from './button';

export enum QuickReplyType {
  text = 'text',
  location = 'location',
  user_phone_number = 'user_phone_number',
  user_email = 'user_email',
}

export const cordinatesSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const payloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(PayloadType.location),
    coordinates: cordinatesSchema,
  }),
  z.object({
    type: z.literal(PayloadType.attachments),
    attachment: attachmentPayloadSchema,
  }),
]);

export const stdQuickReplySchema = z.object({
  content_type: z.enum(QuickReplyType).meta({
    title: 'Content type',
    description: 'The type of quick reply to render.',
  }),
  title: z.string().meta({
    title: 'Title',
    description: 'The label shown to the user.',
  }),
  payload: z.string().meta({
    title: 'Payload',
    description: 'The value sent back when the quick reply is selected.',
  }),
});

export type Payload = z.infer<typeof payloadSchema>;

export type StdQuickReply = z.infer<typeof stdQuickReplySchema>;
