/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { defineAction } from '../../../src';
import type { Settings } from '../../../src/dsl.types';
import type { LoopExampleContext } from '../context';

const inputSchema = z.object({
  text: z.string(),
});
const outputSchema = z.object({
  text: z.string(),
});

type SendTextMessageInput = z.infer<typeof inputSchema>;
type SendTextMessageOutput = z.infer<typeof outputSchema>;

export const sendTextMessage = defineAction<
  SendTextMessageInput,
  SendTextMessageOutput,
  LoopExampleContext,
  Settings
>({
  name: 'send_text_message',
  description: 'Mock action that emits a text message to the subscriber.',
  inputSchema,
  outputSchema,
  execute: async ({ input, context }) => {
    context.log('Send text message', { text: input.text });

    return {
      text: input.text,
    };
  },
});
