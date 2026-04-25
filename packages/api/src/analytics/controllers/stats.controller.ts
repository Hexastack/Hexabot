/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, Query } from '@nestjs/common';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';

import {
  StatsFindDatumDto,
  StatsFindDto,
  StatsSummaryDto,
  StatsThreadSnapshotDto,
} from '../dto/stats.dto';
import {
  StatsOrmEntity,
  StatsType,
  ToLinesType,
} from '../entities/stats.entity';
import { StatsService } from '../services/stats.service';
import { aMonthAgo } from '../utilities/a-month-ago';

@Controller('stats')
export class StatsController extends BaseOrmController<StatsOrmEntity> {
  constructor(protected readonly statsService: StatsService) {
    super(statsService);
  }

  /**
   * Retrieves message stats within a specified time range.
   *
   * @param dto - Parameters for filtering messages (Start & End dates).
   * @returns A promise that resolves to an array of messages formatted for the line chart.
   */
  @Get('messages')
  async findMessages(
    @Query()
    dto: StatsFindDto,
  ): Promise<ToLinesType[]> {
    const { from = aMonthAgo(), to = new Date() } = dto;
    const types: StatsType[] = [
      StatsType.all_messages,
      StatsType.incoming,
      StatsType.outgoing,
    ];
    const result = await this.statsService.findMessages(from, to, types);

    return StatsOrmEntity.toLines(result, types);
  }

  /**
   * Retrieves message stats within a specified time range for a given message type
   *
   * @param dto - Parameters for filtering data (Start & End dates, Type).
   * @returns A promise that resolves to an array of data formatted as lines.
   */
  @Get('datum')
  async datum(
    @Query()
    dto: StatsFindDatumDto,
  ): Promise<ToLinesType[]> {
    const { from = aMonthAgo(), to = new Date(), type } = dto;
    const result = await this.statsService.findMessages(from, to, [type]);

    return StatsOrmEntity.toLines(result, [type]);
  }

  /**
   * Retrieves audience stats within a specified time range.
   *
   * @param dto - Parameters for filtering messages (Start & End dates).
   * @returns A promise that resolves to an array of data formatted for the line chart.
   */
  @Get('audiance')
  async audiance(
    @Query()
    dto: StatsFindDto,
  ): Promise<ToLinesType[]> {
    const { from = aMonthAgo(), to = new Date() } = dto;
    const types: StatsType[] = [
      StatsType.new_users,
      StatsType.returning_users,
      StatsType.retention,
    ];
    const result = await this.statsService.findMessages(from, to, types);

    return StatsOrmEntity.toLines(result, types);
  }

  /**
   * Retrieves new thread and handoff stats for the thread snapshot chart.
   *
   * @param dto - Parameters for filtering snapshot days (Start & End dates).
   * @returns A promise that resolves to bar chart compatible thread stats.
   */
  @Get('thread-snapshot')
  async threadSnapshot(
    @Query()
    dto: StatsFindDto,
  ): Promise<StatsThreadSnapshotDto> {
    const { from, to } = dto;

    return await this.statsService.getThreadSnapshot(from, to);
  }

  /**
   * Retrieves overview stats for workflows, runs, success rate, and messages.
   *
   * @returns A promise that resolves to the overview stats for the last 24 hours.
   */
  @Get('summary')
  async summary(): Promise<StatsSummaryDto> {
    return await this.statsService.getSummary();
  }
}
