/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { z } from 'zod';

// entity=`-1` to match text message
// entity=`-2` for postback payload
// entity is `String` for NLP entities
export const captureVarSchema = z.object({
  entity: z.union([z.number().min(-2).max(-1), z.string()]),
  context_var: z.string().regex(/^[a-z][a-z_0-9]*$/),
});

export type CaptureVar = z.infer<typeof captureVarSchema>;
