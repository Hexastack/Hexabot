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
import { Exclude, Expose, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { BotStatsType } from '../entities/bot-stats.entity';
import { IsLessThanDate } from '../validation-rules/is-less-than-date';

@Exclude()
export class BotStatsStub extends BaseStub {
  @Expose()
  type!: BotStatsType;

  @Expose()
  @Type(() => Date)
  day!: Date;

  @Expose()
  value!: number;

  @Expose()
  name!: string;
}

@Exclude()
export class BotStats extends BotStatsStub {}

export class BotStatsCreateDto {
  @ApiProperty({ description: 'Bot statistic type', enum: BotStatsType })
  @IsNotEmpty()
  @IsString()
  type: BotStatsType;

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

export class BotStatsUpdateDto extends PartialType(BotStatsCreateDto) {}

export type BotStatsTransformerDto = DtoTransformerConfig<{
  PlainCls: typeof BotStats;
  FullCls: typeof BotStats;
}>;

export type BotStatsActionDto = DtoActionConfig<{
  create: BotStatsCreateDto;
  update: BotStatsUpdateDto;
}>;

export class BotStatsFindDto {
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

export class BotStatsFindDatumDto extends BotStatsFindDto {
  /**
   * Type for message to retrieve.
   */
  @IsEnum(BotStatsType)
  @IsNotEmpty()
  type: BotStatsType;
}
