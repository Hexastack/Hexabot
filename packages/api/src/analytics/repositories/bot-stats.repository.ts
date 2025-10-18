/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  BotStats,
  BotStatsDto,
  BotStatsTransformerDto,
} from '../dto/bot-stats.dto';
import { BotStatsOrmEntity, BotStatsType } from '../entities/bot-stats.entity';

@Injectable()
export class BotStatsRepository extends BaseOrmRepository<
  BotStatsOrmEntity,
  BotStatsTransformerDto,
  BotStatsDto
> {
  constructor(
    @InjectRepository(BotStatsOrmEntity)
    repository: Repository<BotStatsOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: BotStats,
      FullCls: BotStats,
    });
  }

  /**
   * Retrieves message statistics based on the provided types and time range.
   *
   * @param from - Start date for filtering messages.
   * @param to - End date for filtering messages.
   * @param types - An array of message types to filter.
   * @returns A promise that resolves to an array of message statistics.
   */
  async findMessages(
    from: Date,
    to: Date,
    types: BotStatsType[],
  ): Promise<BotStatsOrmEntity[]> {
    if (!types.length) {
      return [];
    }

    return await this.repository.find({
      where: {
        type: In(types),
        day: Between(from, to),
      },
      order: {
        day: 'ASC',
        createdAt: 'ASC',
        id: 'ASC',
      },
    });
  }

  /**
   * Retrieves the aggregated sum of values for popular blocks within a specified time range.
   *
   * @param from Start date for the time range
   * @param to End date for the time range
   * @param limit Optional maximum number of results to return (defaults to 5)
   * @returns A promise that resolves to an array of objects containing the block ID and the aggregated value
   */
  async findPopularBlocks(
    from: Date,
    to: Date,
    limit: number = 5,
  ): Promise<{ id: string; value: number }[]> {
    if (from > to) {
      return [];
    }

    const results = await this.repository
      .createQueryBuilder('stats')
      .select('stats.name', 'id')
      .addSelect('SUM(stats.value)', 'value')
      .where('stats.type = :type', { type: BotStatsType.popular })
      .andWhere('stats.day BETWEEN :from AND :to', { from, to })
      .groupBy('stats.name')
      .orderBy('value', 'DESC')
      .limit(limit)
      .getRawMany<{ id: string; value: string | number }>();

    return results.map(({ id, value }) => ({
      id,
      value: typeof value === 'number' ? value : Number(value ?? 0),
    }));
  }
}
