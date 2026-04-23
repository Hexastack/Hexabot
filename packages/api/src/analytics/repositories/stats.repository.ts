/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Stats } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { StatsOrmEntity, StatsType } from '../entities/stats.entity';

@Injectable()
export class StatsRepository extends BaseOrmRepository<StatsOrmEntity> {
  constructor(
    @InjectRepository(StatsOrmEntity)
    repository: Repository<StatsOrmEntity>,
  ) {
    super(repository, []);
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
    types: StatsType[],
  ): Promise<Stats[]> {
    if (!types.length) {
      return [];
    }

    return await this.find({
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
