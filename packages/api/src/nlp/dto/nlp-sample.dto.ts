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
import { IsUUIDv4 } from '@hexabot/core/decorators';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

import { Language } from '@/i18n/dto/language.dto';

import { NlpSampleEntityValue, NlpSampleState } from '..//types';

import { NlpSampleEntity } from './nlp-sample-entity.dto';

@Exclude()
export class NlpSampleStub extends BaseStub {
  @Expose()
  text!: string;

  @Expose()
  trained!: boolean;

  @Expose()
  type!: NlpSampleState;

  @Expose()
  language?: string | Language | null;
}

@Exclude()
export class NlpSample extends NlpSampleStub {
  @Expose({ name: 'languageId' })
  language?: string | null;

  @Exclude()
  entities?: never;
}

@Exclude()
export class NlpSampleFull extends NlpSampleStub {
  @Expose({ name: 'language' })
  @Type(() => Language)
  language?: Language | null;

  @Expose()
  @Type(() => NlpSampleEntity)
  entities!: NlpSampleEntity[];
}

export class NlpSampleCreateDto {
  @ApiProperty({ description: 'NLP sample text', type: String })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'If the sample has already been used for training',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  trained?: boolean;

  @ApiPropertyOptional({
    description: 'NLP sample origin',
    enum: NlpSampleState,
  })
  @IsOptional()
  @IsEnum(NlpSampleState)
  type?: NlpSampleState;

  @ApiProperty({
    description: 'Language identifier associated to the sample',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @IsUUIDv4({ message: 'Language must be a valid UUID' })
  language: string;
}

export class NlpSampleDto {
  @ApiProperty({ description: 'NLP sample text', type: String })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({
    description: 'If the sample has already been used for training',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  trained?: boolean;

  @ApiPropertyOptional({
    description: 'NLP sample origin',
    enum: NlpSampleState,
  })
  @IsOptional()
  @IsEnum(NlpSampleState)
  type?: NlpSampleState;

  @ApiProperty({
    description: 'Language code associated to the sample',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  languageCode: string;

  @ApiPropertyOptional({
    description: 'Entities tagged in the sample text',
    isArray: true,
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  entities?: NlpSampleEntityValue[];
}

export class NlpSampleUpdateDto extends PartialType(NlpSampleCreateDto) {}

export type NlpSampleTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof NlpSample;
  FullCls: typeof NlpSampleFull;
}>;

export type TNlpSampleDto = DtoActionConfig<{
  create: NlpSampleCreateDto;
  update: NlpSampleUpdateDto;
}>;
