/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { InferWorkflowBindings } from '@hexabot-ai/agentic';
import { z } from 'zod';

export const bindingKinds = {
  tools: z.strictObject({
    action: z.string().min(1),
    settings: z.record(z.string(), z.unknown()).optional(),
  }),
};

export type RuntimeBindings = InferWorkflowBindings<typeof bindingKinds>;
