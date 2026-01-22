/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CronTime } from 'cron';
import * as z from 'zod';

export const NestCronSchema = z.string().refine(
  (val) => {
    try {
      new CronTime(val);

      return true;
    } catch {
      return false;
    }
  },
  {
    message:
      'The provided cron expression is invalid. Please use the 6-field format: * * * * * *.',
  },
);
