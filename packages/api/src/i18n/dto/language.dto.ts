/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

@Exclude()
export class LanguageStub extends BaseStub {
  @Expose()
  title!: string;

  @Expose()
  code!: string;

  @Expose()
  isDefault!: boolean;

  @Expose()
  isRTL!: boolean;
}

@Exclude()
export class Language extends LanguageStub {}

export class LanguageCreateDto {
  @ApiProperty({ description: 'Language Title', type: String })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ description: 'Language Code', type: String })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Whether Language is RTL', type: Boolean })
  @IsBoolean()
  isRTL: boolean;

  @ApiPropertyOptional({ description: 'Is Default Language ?', type: Boolean })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class LanguageUpdateDto extends PartialType(LanguageCreateDto) {}

export type LanguageTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Language;
  FullCls: typeof Language;
}>;

export type LanguageDto = DtoActionConfig<{
  create: LanguageCreateDto;
  update: LanguageUpdateDto;
}>;
