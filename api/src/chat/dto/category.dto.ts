/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { DtoConfig } from '@/utils/types/dto.types';

export class CategoryCreateDto {
  @ApiProperty({ description: 'Category label', type: String })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiPropertyOptional({ description: 'Category is builtin', type: Boolean })
  @IsOptional()
  @IsBoolean()
  builtin?: boolean;

  @ApiPropertyOptional({ description: 'Zoom', type: Number })
  @IsOptional()
  @IsNumber()
  zoom?: number;

  @ApiPropertyOptional({ description: 'Offset', type: Array })
  @IsOptional()
  @IsArray()
  offset?: [number, number];
}

export class CategoryUpdateDto extends PartialType(CategoryCreateDto) {}

export type CategoryDto = DtoConfig<{
  create: CategoryCreateDto;
}>;
