/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IsString } from 'class-validator';

export class DummyCreateDto {
  @IsString()
  dummy: string;
}
