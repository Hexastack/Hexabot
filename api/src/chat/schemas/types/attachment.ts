/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

import { Attachment } from '@/attachment/schemas/attachment.schema';

// Enum for FileType
export const fileTypeSchema = z.enum([
  'image',
  'video',
  'audio',
  'file',
  'unknown',
]);

export type FileType = z.infer<typeof fileTypeSchema>;

// AttachmentForeignKey type schema
export const attachmentForeignKeySchema = z.object({
  url: z.string().url().optional(),
  attachment_id: z.string().nullable(),
});

export type AttachmentForeignKey = z.infer<typeof attachmentForeignKeySchema>;

// WithUrl helper type
export type WithUrl<A> = A & { url?: string };

// Generic AttachmentPayload type schema
export const attachmentPayloadSchema = <
  A extends WithUrl<Attachment> | AttachmentForeignKey,
>(
  payloadSchema: z.ZodType<A>,
) =>
  z.object({
    type: fileTypeSchema,
    payload: payloadSchema,
  });

export type AttachmentPayload<
  A extends WithUrl<Attachment> | AttachmentForeignKey,
> = z.infer<ReturnType<typeof attachmentPayloadSchema<A>>>;

export type IncomingAttachmentPayload = z.infer<
  ReturnType<typeof attachmentPayloadSchema<AttachmentForeignKey>>
>;
