/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  statsFullSchema,
  statsSchema,
  type WorkflowRunFull,
} from '@hexabot-ai/types';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

import { TDto } from '@/utils/types/dto.types';

import { StatsType } from '../enums/stats-type.enum';
import { IsLessThanDate } from '../validation-rules/is-less-than-date';

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

export type StatsDto = TDto<
  {
    plain: typeof statsSchema;
    full: typeof statsFullSchema;
  },
  {
    create: StatsCreateDto;
    update: StatsUpdateDto;
  }
>;

export class StatsFindDto {
  /**
   * Start date for statistic retrieval.
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @IsLessThanDate('to', {
    message: 'From date must be less than or equal to To date',
  })
  from?: Date;

  /**
   * End date for statistic retrieval.
   */
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  to?: Date;
}

export class StatsFindDatumDto extends StatsFindDto {
  /**
   * Statistic type to retrieve.
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

export type StatsThreadSnapshotSeriesDto = {
  type: StatsType.new_threads | StatsType.handoffs;
  data: number[];
};

export type StatsThreadSnapshotDto = {
  xAxis: string[];
  series: [StatsThreadSnapshotSeriesDto, StatsThreadSnapshotSeriesDto];
};

export type StatsFailedWorkflowRunsDto = {
  total: number;
  runs: WorkflowRunFull[];
};
