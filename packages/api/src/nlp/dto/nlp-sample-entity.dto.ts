/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

import {
  BaseStub,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { NlpEntity } from './nlp-entity.dto';
import { NlpSample } from './nlp-sample.dto';
import { NlpValue } from './nlp-value.dto';

@Exclude()
export class NlpSampleEntityStub extends BaseStub {
  @Expose()
  start?: number | null;

  @Expose()
  end?: number | null;
}

@Exclude()
export class NlpSampleEntity extends NlpSampleEntityStub {
  @Expose({ name: 'entityId' })
  entity!: string;

  @Expose({ name: 'valueId' })
  value!: string;

  @Expose({ name: 'sampleId' })
  sample!: string;
}

@Exclude()
export class NlpSampleEntityFull extends NlpSampleEntityStub {
  @Expose()
  @Type(() => NlpEntity)
  entity!: NlpEntity;

  @Expose()
  @Type(() => NlpValue)
  value!: NlpValue;

  @Expose()
  @Type(() => NlpSample)
  sample!: NlpSample;
}

export class NlpSampleEntityCreateDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  start?: number;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsNumber()
  end?: number;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4', { message: 'Entity must be a valid UUID' })
  entityId: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4', { message: 'Value must be a valid UUID' })
  valueId: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUID('4', { message: 'Sample must be a valid UUID' })
  sampleId: string;
}

export type NlpSampleEntityTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof NlpSampleEntity;
  FullCls: typeof NlpSampleEntityFull;
}>;

export type NlpSampleEntityDto = DtoActionConfig<{
  create: NlpSampleEntityCreateDto;
}>;
