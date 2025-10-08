/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { z } from 'zod';

export const subscriberContextSchema = z.object({
  vars: z.record(z.any()).optional(),
});

export type SubscriberContext = z.infer<typeof subscriberContextSchema>;
