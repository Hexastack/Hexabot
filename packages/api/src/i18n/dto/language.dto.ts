/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  languageFullSchema,
  languageSchema,
  languageStubSchema,
  type Language,
  type LanguageFull,
  type LanguageStub,
} from '@hexabot-ai/types';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

export { languageFullSchema, languageSchema, languageStubSchema };

export type { Language, LanguageFull, LanguageStub };

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

export type LanguageDto = TDto<
  {
    plain: typeof languageSchema;
    full: typeof languageFullSchema;
  },
  {
    create: LanguageCreateDto;
    update: LanguageUpdateDto;
  }
>;
