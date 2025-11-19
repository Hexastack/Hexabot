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
  content_type: z.nativeEnum(QuickReplyType),
  title: z.string(),
  payload: z.string(),
});

export type Payload = z.infer<typeof payloadSchema>;

export type StdQuickReply = z.infer<typeof stdQuickReplySchema>;
