/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { createHash } from 'node:crypto';

export const sha256Hash = (value: string) =>
  createHash('sha256').update(value).digest('base64url');
