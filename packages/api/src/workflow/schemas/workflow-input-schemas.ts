/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import {
  incomingMessageType,
  StdEventType,
  stdIncomingMessageSchema,
} from '@/chat/types/message';
import { payloadSchema } from '@/chat/types/quick-reply';
import { toDraft07JsonSchema } from '@/utils/helpers/zod';

export const conversationalWorkflowInputZodSchema = z
  .object({
    event_type: z.enum(StdEventType),
    message_type: incomingMessageType.optional(),
    payload: z.union([payloadSchema, z.string()]).optional(),
    message: stdIncomingMessageSchema,
    text: z.string(),
    mid: z.string().optional(),
  })
  .strict();

export type ConversationalWorkflowInput = z.infer<
  typeof conversationalWorkflowInputZodSchema
>;

export const conversationalWorkflowInputJsonSchema = toDraft07JsonSchema(
  conversationalWorkflowInputZodSchema,
);

export const scheduledWorkflowInputZodSchema = z
  .object({
    schedule: z.string().nullable(),
    triggered_at: z.string().datetime({ offset: true }).nullable(),
  })
  .strict();

export type ScheduledWorkflowInput = z.infer<
  typeof scheduledWorkflowInputZodSchema
>;

export const scheduledWorkflowInputJsonSchema = toDraft07JsonSchema(
  scheduledWorkflowInputZodSchema,
);

export const manualWorkflowDefaultInputSchemaZodSchema = z.looseObject({});

export type ManualWorkflowDefaultInputSchema = z.infer<
  typeof manualWorkflowDefaultInputSchemaZodSchema
>;

export const manualWorkflowDefaultInputJsonSchema = toDraft07JsonSchema(
  manualWorkflowDefaultInputSchemaZodSchema,
);
