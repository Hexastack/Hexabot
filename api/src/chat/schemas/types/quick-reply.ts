/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { z } from 'zod';

import {
  attachmentForeignKeySchema,
  attachmentPayloadSchema,
  IncomingAttachmentPayload,
} from './attachment';

export const payloadTypeSchema = z.enum(['location', 'attachments']);

export type PayloadType = z.infer<typeof payloadTypeSchema>;

// Define the Payload schema
export const payloadSchema = z.union([
  z.object({
    type: z.literal('location'),
    coordinates: z.object({
      lat: z.number(),
      lon: z.number(),
    }),
  }),
  z.object({
    type: z.literal('attachments'),
    attachments: attachmentPayloadSchema(attachmentForeignKeySchema),
  }),
]);

export type Payload =
  | {
      type: 'location';
      coordinates: {
        lat: number;
        lon: number;
      };
    }
  | {
      type: 'attachments';
      attachments: IncomingAttachmentPayload;
    };

// Enum for QuickReplyType
export enum QuickReplyType {
  text = 'text',
  location = 'location',
  user_phone_number = 'user_phone_number',
  user_email = 'user_email',
}

export const quickReplyTypeSchema = z.enum(
  Object.values(QuickReplyType) as [string, ...string[]],
);

// Schema for StdQuickReply with conditional constraints using superRefine
export const stdQuickReplySchema = z
  .object({
    content_type: quickReplyTypeSchema,
    title: z.string().max(20).optional(),
    payload: z.string().max(1000).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.content_type === 'text') {
      if (!val.title) {
        ctx.addIssue({
          path: ['title'],
          code: z.ZodIssueCode.custom,
          message: "Title is required when content_type is 'text'.",
        });
      }

      if (!val.payload) {
        ctx.addIssue({
          path: ['payload'],
          code: z.ZodIssueCode.custom,
          message: "Payload is required when content_type is 'text'.",
        });
      }
    }
  });

export type StdQuickReply = z.infer<typeof stdQuickReplySchema>;

// Schema for the array with max 11 items
export const quickRepliesArraySchema = z
  .array(stdQuickReplySchema)
  .max(11, { message: 'You can provide up to 11 quick replies.' });

export type QuickRepliesArray = z.infer<typeof quickRepliesArraySchema>;
