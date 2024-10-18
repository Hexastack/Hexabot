/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Controller, Get, Query } from '@nestjs/common';

import { BotStatsFindDatumDto, BotStatsFindDto } from '../dto/bot-stats.dto';
import { BotStats, BotStatsType } from '../schemas/bot-stats.schema';
import { BotStatsService } from '../services/bot-stats.service';
import { aMonthAgo } from '../utilities';

import { ToLinesType } from './../schemas/bot-stats.schema';

@Controller('botstats')
export class BotStatsController {
  constructor(private readonly botStatsService: BotStatsService) {}

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
    return BotStats.toLines(result, types);
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

    return BotStats.toLines(result, [type]);
  }

  /**
   * Retrieves conversation message stats within a specified time range
   *
   * @param dto - Parameters for filtering data (Start & End dates, Type).
   * @returns A promise that resolves to an array of data formatted for the line chart.
   */
  @Get('conversation')
  async conversation(
    @Query()
    dto: BotStatsFindDto,
  ): Promise<ToLinesType[]> {
    const { from = aMonthAgo(), to = new Date() } = dto;
    const types: BotStatsType[] = [
      BotStatsType.new_conversations,
      BotStatsType.existing_conversations,
    ];

    const result = await this.botStatsService.findMessages(from, to, types);
    return BotStats.toLines(result, types);
  }

  /**
   * Retrieves audience message stats within a specified time range.
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
    return BotStats.toLines(result, types);
  }

  /**
   * Retrieves popular blocks stats within a specified time range.
   *
   * @param dto - Parameters for filtering messages (Start & End dates).
   * @returns A promise that resolves to an array of data formatted for the bar chart.
   */
  @Get('popularBlocks')
  async popularBlocks(
    @Query()
    dto: BotStatsFindDto,
  ): Promise<{ id: string; name: string; value: number }[]> {
    const { from = aMonthAgo(), to = new Date() } = dto;
    const results = await this.botStatsService.findPopularBlocks(from, to);

    return BotStats.toBars(results);
  }
}
