/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { DtoActionConfig } from '@/utils/types/dto.types';
import { IsObjectId } from '@/utils/validation-rules/is-object-id';

import { NlpMetadata } from '../schemas/types';

export class NlpValueCreateDto {
  @ApiProperty({ description: 'Nlp value', type: String })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiPropertyOptional({
    description: 'Nlp value expressions',
    isArray: true,
    type: Array,
  })
  @IsOptional()
  @IsArray()
  expressions?: string[];

  @ApiPropertyOptional({ description: 'Nlp value metadata', type: Object })
  @IsOptional()
  @IsObject()
  metadata?: NlpMetadata;

  @ApiPropertyOptional({ description: 'Nlp Value Description', type: String })
  @IsString()
  @IsOptional()
  doc?: string;

  @ApiPropertyOptional({ description: 'Nlp value is builtin', type: Boolean })
  @IsOptional()
  @IsBoolean()
  builtin?: boolean;

  @ApiProperty({ description: 'Nlp value entity', type: String })
  @IsString()
  @IsNotEmpty()
  @IsObjectId({ message: 'Entity must be a valid ObjectId' })
  entity: string | null;
}

export class NlpValueUpdateDto {
  @ApiPropertyOptional({ description: 'Foreign ID', type: String })
  @IsOptional()
  @IsString()
  foreign_id?: string;

  @ApiPropertyOptional({ description: 'Nlp value', type: String })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({
    description: 'Nlp value expressions',
    isArray: true,
    type: Array,
  })
  @IsOptional()
  @IsArray()
  expressions?: string[];

  @ApiPropertyOptional({ description: 'Nlp value entity', type: String })
  @IsOptional()
  @IsString()
  @IsObjectId({ message: 'Entity must be a valid ObjectId' })
  entity?: string | null;

  @ApiPropertyOptional({ description: 'Nlp Metadata', type: Object })
  @IsObject()
  @IsOptional()
  metadata?: NlpMetadata;

  @ApiPropertyOptional({ description: 'Nlp Value Description', type: String })
  @IsString()
  @IsOptional()
  doc?: string;

  @ApiPropertyOptional({ description: 'Nlp value is builtin', type: Boolean })
  @IsOptional()
  @IsBoolean()
  builtin?: boolean;
}

export type NlpValueDto = DtoActionConfig<{
  create: NlpValueCreateDto;
  update: NlpValueUpdateDto;
}>;
