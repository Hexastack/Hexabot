/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  SettingsSchema as BaseSettingsSchema,
  BaseWorkflowContext,
} from '@hexabot-ai/agentic';
import { z } from 'zod';

import { createAction } from '@/actions/create-action';

const InputSchema = z.object({
  message: z.string(),
});
type Input = z.infer<typeof InputSchema>;

const OutputSchema = z.object({
  echoed: z.string(),
});
type Output = z.infer<typeof OutputSchema>;

const ActionSettingsSchema = BaseSettingsSchema.extend({
  prefix: z.string().default('Echo: '),
});
type ActionSettings = z.infer<typeof ActionSettingsSchema>;

export const DummyAction = createAction<
  Input,
  Output,
  BaseWorkflowContext,
  ActionSettings
>({
  name: 'dummy_action',
  description: 'Echoes the provided message',
  inputSchema: InputSchema,
  outputSchema: OutputSchema,
  settingsSchema: ActionSettingsSchema,
  async execute({ input, settings }) {
    const prefix = settings.prefix ?? '';

    return { echoed: `${prefix}${input.message}` };
  },
});
