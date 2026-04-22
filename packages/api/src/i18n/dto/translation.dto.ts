/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  translationFullSchema,
  translationSchema,
  translationStubSchema,
  type Translation,
  type TranslationFull,
  type TranslationStub,
} from '@hexabot-ai/types';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

export { translationFullSchema, translationSchema, translationStubSchema };

export type { Translation, TranslationFull, TranslationStub };

export class TranslationCreateDto {
  @ApiProperty({ description: 'Translation str', type: String })
  @IsNotEmpty()
  @IsString()
  str: string;

  @ApiProperty({ description: 'Translations', type: Object })
  @IsNotEmpty()
  @IsObject()
  translations: Record<string, string>;
}

export class TranslationUpdateDto extends PartialType(TranslationCreateDto) {}

export type TranslationDto = TDto<
  {
    plain: typeof translationSchema;
    full: typeof translationFullSchema;
  },
  {
    create: TranslationCreateDto;
    update: TranslationUpdateDto;
  }
>;
