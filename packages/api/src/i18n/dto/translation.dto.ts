/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

import { BaseStub, BuildDtoType } from '@/utils/types/dto.types';

@Exclude()
export class TranslationStub extends BaseStub {
  @Expose()
  str!: string;

  @Expose()
  translations!: Record<string, string>;
}

@Exclude()
export class Translation extends TranslationStub {}

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

export type TranslationDto = BuildDtoType<
  {
    PlainCls: typeof Translation;
    FullCls: typeof Translation;
  },
  {
    create: TranslationCreateDto;
    update: TranslationUpdateDto;
  }
>;
