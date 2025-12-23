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
  BotStatsActionDto,
  BotStatsTransformerDto,
} from '../dto/bot-stats.dto';
import { BotStatsOrmEntity, BotStatsType } from '../entities/bot-stats.entity';

@Injectable()
export class BotStatsRepository extends BaseOrmRepository<
  BotStatsOrmEntity,
  BotStatsTransformerDto,
  BotStatsActionDto
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
}
