/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { Block } from './block.dto';

@Exclude()
export class CategoryStub extends BaseStub {
  @Expose()
  label!: string;

  @Expose()
  builtin!: boolean;

  @Expose()
  zoom!: number;

  @Expose()
  offset!: [number, number];
}

@Exclude()
export class Category extends CategoryStub {
  @Exclude()
  blocks?: never;
}

@Exclude()
export class CategoryFull extends CategoryStub {
  @Expose()
  @Type(() => Block)
  blocks?: Block[];
}

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

export type CategoryTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Category;
  FullCls: typeof CategoryFull;
}>;

export type CategoryDtoConfig = DtoActionConfig<{
  create: CategoryCreateDto;
  update: CategoryUpdateDto;
}>;

export type CategoryDto = CategoryDtoConfig;
