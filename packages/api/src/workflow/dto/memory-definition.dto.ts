/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Min,
} from 'class-validator';
import { JSONSchema7 } from 'json-schema';
import { z } from 'zod';

import { Validate } from '@/utils/decorators/validate.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { MemoryScope } from '../types';

const jsonSchemaSchema = z.union([z.boolean(), z.object({}).passthrough()]);

@Exclude()
export class MemoryDefinitionStub extends BaseStub {
  @Expose()
  name!: string;

  @Expose()
  slug!: string;

  @Expose()
  scope!: MemoryScope;

  @Expose()
  schema!: JSONSchema7 | boolean;

  @Expose()
  ttlSeconds?: number | null;
}

@Exclude()
export class MemoryDefinition extends MemoryDefinitionStub {}

@Exclude()
export class MemoryDefinitionFull extends MemoryDefinitionStub {}

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
  @Validate(jsonSchemaSchema)
  schema!: JSONSchema7 | boolean;

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

export type MemoryDefinitionTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof MemoryDefinition;
  FullCls: typeof MemoryDefinitionFull;
}>;

export type MemoryDefinitionDtoConfig = DtoActionConfig<{
  create: MemoryDefinitionCreateDto;
  update: MemoryDefinitionUpdateDto;
}>;

export type MemoryDefinitionDto = MemoryDefinitionDtoConfig;
