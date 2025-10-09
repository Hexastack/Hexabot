/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ParseArrayPipe } from '@nestjs/common';

export const populateQueryPipe = new ParseArrayPipe({
  items: String,
  separator: ',',
  optional: true,
});
