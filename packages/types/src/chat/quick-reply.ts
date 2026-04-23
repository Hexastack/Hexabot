/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

import { attachmentPayloadSchema } from "./attachment";
import { PayloadType } from "./button";

export const coordinatesSchema = z.object({
  lat: z.number(),
  lon: z.number(),
});

export const payloadSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(PayloadType.location),
    coordinates: coordinatesSchema,
  }),
  z.object({
    type: z.literal(PayloadType.attachment),
    attachment: attachmentPayloadSchema,
  }),
]);

export const stdQuickReplySchema = z.object({
  title: z.string().meta({
    title: "Title",
    description: "The label shown to the user.",
  }),
  payload: z.string().meta({
    title: "Payload",
    description: "The value sent back when the quick reply is selected.",
  }),
});

export type Payload = z.infer<typeof payloadSchema>;

export type StdQuickReply = z.infer<typeof stdQuickReplySchema>;
