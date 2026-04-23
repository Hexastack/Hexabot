/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from "zod";

export enum FileType {
  image = "image",
  video = "video",
  audio = "audio",
  file = "file",
  unknown = "unknown",
}

export const fileTypeSchema = z.enum(FileType);

export const attachmentRefSchema = z.union([
  z.object({
    id: z.string().nullable(),
    url: z.string().optional(),
  }),
  z.object({
    id: z.string().nullable().optional(),
    url: z.string(),
  }),
]);

export type AttachmentRef = z.infer<typeof attachmentRefSchema>;

export const attachmentPayloadSchema = z.object({
  type: fileTypeSchema,
  payload: attachmentRefSchema,
});

export type AttachmentPayload = z.infer<typeof attachmentPayloadSchema>;

export type TAttachmentForeignKey = AttachmentRef;

export interface IAttachmentPayload {
  type: FileType;
  payload: AttachmentRef;
}
