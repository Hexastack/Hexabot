/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import {
  BaseStub,
  BuildDto,
  DtoActionConfig,
  DtoTransformerConfig,
} from '@/utils/types/dto.types';

import { StatsType } from '../enums/stats-type.enum';
import { IsLessThanDate } from '../validation-rules/is-less-than-date';

@Exclude()
export class StatsStub extends BaseStub {
  @Expose()
  type!: StatsType;

  @Expose()
  @Type(() => Date)
  day!: Date;

  @Expose()
  value!: number;

  @Expose()
  name!: string;
}

@Exclude()
export class Stats extends StatsStub {}

export class StatsCreateDto {
  @ApiProperty({ description: 'Bot statistic type', enum: StatsType })
  @IsNotEmpty()
  @IsString()
  type: StatsType;

  @ApiProperty({
    description: 'Aggregation day of the statistic',
    type: String,
    format: 'date-time',
  })
  @IsString()
  @IsNotEmpty()
  day: Date;

  @ApiProperty({
    description: 'Aggregated value of the statistic',
    type: Number,
  })
  @IsNotEmpty()
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Display name of the statistic', type: String })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class StatsUpdateDto extends PartialType(StatsCreateDto) {}

export type StatsTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof Stats;
  FullCls: typeof Stats;
}>;

export type StatsActionDto = DtoActionConfig<{
  create: StatsCreateDto;
  update: StatsUpdateDto;
}>;

export type StatsDto = BuildDto<StatsActionDto, StatsTransformerDto>;

export class StatsFindDto {
  /**
   * Start date for message retrieval.
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsLessThanDate('to', {
    message: 'From date must be less than or equal to To date',
  })
  from?: Date;

  /**
   * End date for message retrieval.
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  to?: Date;
}

export class StatsFindDatumDto extends StatsFindDto {
  /**
   * Type for message to retrieve.
   */
  @IsEnum(StatsType)
  @IsOptional()
  type: StatsType;
}

export type StatsSummaryDto = {
  totalWorkflows: number;
  totalRunsLast24h: number;
  successRateLast24h: number;
  totalMessagesLast24h: number;
};
