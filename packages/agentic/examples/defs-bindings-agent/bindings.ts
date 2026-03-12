/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import type { InferWorkflowBindings } from '../../src';

export const bindingKinds = {
  tools: {
    schema: z.strictObject({
      action: z.string(),
      settings: z.record(z.string(), z.unknown()).optional(),
    }),
    multiple: true,
  },
};

export type AgentBindings = InferWorkflowBindings<typeof bindingKinds>;
