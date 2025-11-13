/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@hexabot/core/database';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

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

export type TranslationTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Translation;
  FullCls: typeof Translation;
}>;

export type TranslationDtoConfig = DtoActionConfig<{
  create: TranslationCreateDto;
  update: TranslationUpdateDto;
}>;
