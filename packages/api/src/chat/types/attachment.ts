/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

export enum FileType {
  image = 'image',
  video = 'video',
  audio = 'audio',
  file = 'file',
  unknown = 'unknown',
}

export const fileTypeSchema = z.nativeEnum(FileType);

/**
 * The `AttachmentRef` type defines two possible ways to reference an attachment:
 * 1. By `id`: This is used when the attachment is uploaded and stored in the Hexabot system.
 * The `id` field represents the unique identifier of the uploaded attachment in the system.
 * 2. By `url`: This is used when the attachment is externally hosted, especially when
 * the content is generated or retrieved by a plugin that consumes a third-party API.
 * In this case, the `url` field contains the direct link to the external resource.
 */

export const attachmentRefSchema = z.union([
  z.object({
    id: z.string().nullable(),
  }),
  z.object({
    url: z.string(),
  }),
]);

export type AttachmentRef = z.infer<typeof attachmentRefSchema>;

export const attachmentPayloadSchema = z.object({
  type: fileTypeSchema,
  payload: attachmentRefSchema,
});

export type AttachmentPayload = z.infer<typeof attachmentPayloadSchema>;

/** @deprecated */
export type WithUrl<A> = A & { url?: string };
