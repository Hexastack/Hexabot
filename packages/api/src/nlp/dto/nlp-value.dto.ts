/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

import { IsUUIDv4 } from '@/utils/decorators/is-uuid.decorator';
import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';
import { TStubOrFull } from '@/utils/types/format.types';

import { NlpMetadata } from '..//types';

import { NlpEntity } from './nlp-entity.dto';

@Exclude()
export class NlpValueStub extends BaseStub {
  @Expose()
  @Transform(({ value, obj }) => {
    const resolved = value ?? obj?.foreign_id ?? null;
    return resolved === null ? undefined : resolved;
  })
  foreignId?: string | null;

  @Expose()
  value!: string;

  @Expose()
  expressions!: string[];

  @Expose()
  metadata?: NlpMetadata | null;

  @Expose()
  @Transform(({ value }) => (value === null ? undefined : value))
  doc?: string | null;

  @Expose()
  builtin!: boolean;
}

@Exclude()
export class NlpValue extends NlpValueStub {
  @Expose({ name: 'entityId' })
  entity!: string;
}

@Exclude()
export class NlpValueFull extends NlpValueStub {
  @Expose()
  @Type(() => NlpEntity)
  entity!: NlpEntity;
}

@Exclude()
export class NlpValueWithCount extends NlpValue {
  @Expose()
  nlpSamplesCount!: number;
}

@Exclude()
export class NlpValueFullWithCount extends NlpValueFull {
  @Expose()
  nlpSamplesCount!: number;
}

export type TNlpValueCount<T> = TStubOrFull<
  T,
  NlpValueWithCount,
  NlpValueFullWithCount
>;

export class NlpValueCreateDto {
  @ApiProperty({ description: 'NLP value label', type: String })
  @IsNotEmpty()
  @IsString()
  value: string;

  @ApiPropertyOptional({
    description: 'NLP value synonyms',
    isArray: true,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expressions?: string[];

  @ApiPropertyOptional({
    description: 'Metadata associated to the value',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: NlpMetadata;

  @ApiPropertyOptional({
    description: 'Foreign identifier for the value',
    type: String,
  })
  @IsOptional()
  @IsString()
  foreignId?: string;

  @ApiPropertyOptional({
    description: 'Description of the value',
    type: String,
  })
  @IsOptional()
  @IsString()
  doc?: string;

  @ApiPropertyOptional({
    description: 'Marks the value as built-in',
    type: Boolean,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  builtin?: boolean;

  @ApiProperty({
    description: 'Identifier of the parent NLP entity',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  @IsUUIDv4({ message: 'Entity must be a valid UUID' })
  entity: string;
}

export class NlpValueUpdateDto extends PartialType(NlpValueCreateDto) {}

export type NlpValueTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof NlpValue;
  FullCls: typeof NlpValueFull;
}>;

export type NlpValueDtoConfig = DtoActionConfig<{
  create: NlpValueCreateDto;
  update: NlpValueUpdateDto;
}>;
