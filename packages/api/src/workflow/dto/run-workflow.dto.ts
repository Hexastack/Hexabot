/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional } from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';

export class RunWorkflowDto {
  @ApiPropertyOptional({
    description: 'Arbitrary input payload forwarded to the workflow run',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Subscriber/User linked to the workflow run',
    type: String,
  })
  @IsOptional()
  @IsUUIDv4({
    message: 'triggeredBy must be a valid UUID',
  })
  triggeredBy?: string;
}
