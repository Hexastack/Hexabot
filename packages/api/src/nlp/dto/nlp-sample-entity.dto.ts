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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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
  @IsUUIDv4({ message: 'Entity must be a valid UUID' })
  entity: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUIDv4({ message: 'Value must be a valid UUID' })
  value: string;

  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  @IsUUIDv4({ message: 'Sample must be a valid UUID' })
  sample: string;
}

export type NlpSampleEntityTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof NlpSampleEntity;
  FullCls: typeof NlpSampleEntityFull;
}>;

export type NlpSampleEntityDto = DtoActionConfig<{
  create: NlpSampleEntityCreateDto;
}>;
