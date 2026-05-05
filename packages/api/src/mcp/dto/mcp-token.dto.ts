/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { mcpTokenFullSchema, mcpTokenSchema } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

export class McpTokenCreateDto {
  @ApiProperty({
    description: 'Human-readable MCP token name',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Optional token expiry date',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string | null;
}

export class McpTokenUpdateDto extends PartialType(McpTokenCreateDto) {}

export type McpTokenDto = TDto<
  {
    plain: typeof mcpTokenSchema;
    full: typeof mcpTokenFullSchema;
  },
  {
    create: McpTokenCreateDto;
    update: McpTokenUpdateDto;
  }
>;
