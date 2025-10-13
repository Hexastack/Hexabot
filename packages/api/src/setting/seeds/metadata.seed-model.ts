/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MetadataCreateDto } from '../dto/metadata.dto';

export const DEFAULT_METADATA = [
  {
    name: 'db-version',
    value: process.env.npm_package_version,
  },
] as const satisfies MetadataCreateDto[];
