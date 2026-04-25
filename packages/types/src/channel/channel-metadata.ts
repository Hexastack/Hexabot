/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

const jsonObjectSchema: z.ZodType<Record<string, unknown>> = z.record(
  z.string(),
  z.unknown(),
);
const channelMetadataObjectSchema = z.object({
  name: z.string(),
  settingsSchema: jsonObjectSchema,
});

export const channelMetadataSchema = channelMetadataObjectSchema;

export type ChannelMetadata = z.infer<typeof channelMetadataSchema>;
