/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { sourceFullSchema, sourceSchema } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

export class SourceCreateDto {
  @ApiProperty({ description: 'Source name', type: String })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Channel name bound to this source',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  channel!: string;

  @ApiPropertyOptional({
    description: 'Channel settings bound to this source instance',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Whether this source is active and can receive inbound events',
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  state?: boolean;

  @ApiPropertyOptional({
    description: 'Default workflow ID for this source',
    type: String,
    default: null,
  })
  @IsOptional()
  @IsUUIDv4({ message: 'defaultWorkflow must be a valid UUID' })
  defaultWorkflow?: string | null;
}

export class SourceUpdateDto extends PartialType(SourceCreateDto) {}

export type SourceDto = TDto<
  {
    plain: typeof sourceSchema;
    full: typeof sourceFullSchema;
  },
  {
    create: SourceCreateDto;
    update: SourceUpdateDto;
  }
>;
