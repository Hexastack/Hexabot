/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { memoryRecordFullSchema, memoryRecordSchema } from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import { TDto } from '@/utils/types/dto.types';

import type { MemoryValue } from '../types';

export class MemoryRecordCreateDto {
  @ApiProperty({
    description: 'Memory definition id',
    type: String,
  })
  @IsString()
  @IsUUIDv4({ message: 'definition must be a valid UUID' })
  definition!: string;

  @ApiPropertyOptional({
    description: 'Owner profile id for user-scoped memory',
    type: String,
  })
  @IsString()
  @IsUUIDv4({ message: 'owner must be a valid UUID' })
  owner: string;

  @ApiPropertyOptional({
    description: 'Workflow id when scope is workflow or run',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'workflow must be a valid UUID' })
  workflow?: string | null;

  @ApiPropertyOptional({
    description: 'Workflow run id when scope is run',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'workflowRun must be a valid UUID' })
  run?: string | null;

  @ApiPropertyOptional({
    description: 'Thread id when scope is thread',
    type: String,
  })
  @IsOptional()
  @IsString()
  @IsUUIDv4({ message: 'thread must be a valid UUID' })
  thread?: string | null;

  @ApiProperty({
    description: 'Memory payload respecting the definition schema',
    type: Object,
  })
  @IsDefined()
  value!: MemoryValue;

  @ApiPropertyOptional({
    description: 'TTL in seconds overriding the definition TTL',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ttlSeconds?: number | null;

  @ApiPropertyOptional({
    description: 'Optional expiration date (computed from TTL by default)',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date | null;
}

export class MemoryRecordUpdateDto extends PartialType(MemoryRecordCreateDto) {}

export type MemoryRecordDto = TDto<
  {
    plain: typeof memoryRecordSchema;
    full: typeof memoryRecordFullSchema;
  },
  {
    create: MemoryRecordCreateDto;
    update: MemoryRecordUpdateDto;
  }
>;
