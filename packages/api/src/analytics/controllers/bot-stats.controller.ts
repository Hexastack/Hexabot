/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, Query } from '@nestjs/common';

import { BaseOrmController } from '@/utils/generics/base-orm.controller';

import {
  BotStatsActionDto,
  BotStatsFindDatumDto,
  BotStatsFindDto,
  BotStatsTransformerDto,
} from '../dto/bot-stats.dto';
import {
  BotStatsOrmEntity,
  BotStatsType,
  ToLinesType,
} from '../entities/bot-stats.entity';
import { BotStatsService } from '../services/bot-stats.service';
import { aMonthAgo } from '../utilities/a-month-ago';

@Controller('botstats')
export class BotStatsController extends BaseOrmController<
  BotStatsOrmEntity,
  BotStatsTransformerDto,
  BotStatsActionDto
> {
  constructor(protected readonly botStatsService: BotStatsService) {
    super(botStatsService);
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
    dto: BotStatsFindDto,
  ): Promise<ToLinesType[]> {
    const { from = aMonthAgo(), to = new Date() } = dto;
    const types: BotStatsType[] = [
      BotStatsType.all_messages,
      BotStatsType.incoming,
      BotStatsType.outgoing,
    ];
    const result = await this.botStatsService.findMessages(from, to, types);

    return BotStatsOrmEntity.toLines(result, types);
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
    dto: BotStatsFindDatumDto,
  ): Promise<ToLinesType[]> {
    const { from = aMonthAgo(), to = new Date(), type } = dto;
    const result = await this.botStatsService.findMessages(from, to, [type]);

    return BotStatsOrmEntity.toLines(result, [type]);
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
    dto: BotStatsFindDto,
  ): Promise<ToLinesType[]> {
    const { from = aMonthAgo(), to = new Date() } = dto;
    const types: BotStatsType[] = [
      BotStatsType.new_users,
      BotStatsType.returning_users,
      BotStatsType.retention,
    ];
    const result = await this.botStatsService.findMessages(from, to, types);

    return BotStatsOrmEntity.toLines(result, types);
  }
}
