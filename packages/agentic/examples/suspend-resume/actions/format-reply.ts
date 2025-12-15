/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { defineAction, type Settings } from '../../../src';
import type { SuspendResumeContext } from '../context';

const inputSchema = z.object({
  reply: z.string(),
});
const outputSchema = z.object({
  message: z.string(),
});

type FormatReplyInput = z.infer<typeof inputSchema>;
type FormatReplyOutput = z.infer<typeof outputSchema>;

export const formatReply = defineAction<
  FormatReplyInput,
  FormatReplyOutput,
  SuspendResumeContext,
  Settings
>({
  name: 'format_reply',
  description: 'Formats the user reply captured after resuming execution.',
  inputSchema,
  outputSchema,
  execute: async ({ input, context }) => {
    const trimmed = input.reply.trim();

    context.log('Formatting reply after resume', { reply: trimmed });

    return {
      message: trimmed
        ? `User replied: ${trimmed}`
        : 'No reply was provided when resuming the workflow.',
    };
  },
});
