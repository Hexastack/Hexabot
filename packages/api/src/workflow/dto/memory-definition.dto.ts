/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  memoryDefinitionFullSchema,
  memoryDefinitionSchema,
} from '@hexabot-ai/types';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { JSONSchema7 as JsonSchema } from 'json-schema';
import { z } from 'zod';

import { Validate } from '@/utils/decorators/validate.decorator';
import { TDto } from '@/utils/types/dto.types';

import { MemoryScope } from '../types';

export class MemoryDefinitionCreateDto {
  @ApiProperty({ description: 'Memory definition name', type: String })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Slug used as reference in workflow YAML (snake_case)',
    type: String,
    example: 'customer_profile',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z0-9_]+$/, {
    message:
      'slug must contain only lowercase letters, numbers, and underscores',
  })
  slug!: string;

  @ApiProperty({
    description: 'Scope at which the memory is available',
    enum: MemoryScope,
    enumName: 'MemoryScope',
  })
  @IsEnum(MemoryScope)
  scope!: MemoryScope;

  @ApiProperty({
    description: 'JSON Schema describing the memory structure',
    type: Object,
  })
  @Validate(z.looseObject({}))
  schema!: JsonSchema;

  @ApiPropertyOptional({
    description: 'Default TTL in seconds applied to records of this memory',
    type: Number,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  ttlSeconds?: number | null;
}

export class MemoryDefinitionUpdateDto extends PartialType(
  MemoryDefinitionCreateDto,
) {}

export type MemoryDefinitionDto = TDto<
  {
    plain: typeof memoryDefinitionSchema;
    full: typeof memoryDefinitionFullSchema;
  },
  {
    create: MemoryDefinitionCreateDto;
    update: MemoryDefinitionUpdateDto;
  }
>;
