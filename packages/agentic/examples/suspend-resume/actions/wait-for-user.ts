/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { defineAction, type Settings } from '../../../src';
import type { SuspendResumeContext } from '../context';

const inputSchema = z.object({
  prompt: z.string(),
});
const resumeSchema = z.object({
  reply: z.string(),
});
const outputSchema = z.object({
  reply: z.string(),
});

type WaitForUserInput = z.infer<typeof inputSchema>;
type WaitForUserOutput = z.infer<typeof outputSchema>;

export const waitForUser = defineAction<
  WaitForUserInput,
  WaitForUserOutput,
  SuspendResumeContext,
  Settings
>({
  name: 'wait_for_user',
  description: 'Pause execution until a reply is provided to the resume call.',
  inputSchema,
  outputSchema,
  execute: async ({ input, context }) => {
    context.log('Suspending workflow until we get a reply', {
      prompt: input.prompt,
    });

    const resumeData = await context.workflow.suspend({
      reason: 'awaiting_user',
      data: { prompt: input.prompt },
    });
    const parsed = resumeSchema.safeParse(resumeData);
    if (!parsed.success) {
      throw new Error('resumeData must include a string reply');
    }

    return { reply: parsed.data.reply };
  },
});
