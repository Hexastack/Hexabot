/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsString,
  IsOptional,
  IsNumber,
} from 'class-validator';

export class TranslationCreateDto {
  @ApiProperty({ description: 'Translation str', type: String })
  @IsNotEmpty()
  @IsString()
  str: string;

  @ApiProperty({ description: 'Translations', type: Object })
  @IsNotEmpty()
  @IsObject()
  translations: Record<string, string>;

  @ApiProperty({ description: 'Translated', type: Number })
  @IsNotEmpty()
  @IsNumber()
  translated: number;
}

export class TranslationUpdateDto {
  @ApiPropertyOptional({ description: 'Translation str', type: String })
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  str?: string;

  @ApiPropertyOptional({ description: 'Translations', type: Object })
  @IsNotEmpty()
  @IsObject()
  @IsOptional()
  translations?: Record<string, string>;
}
