/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { BotStats, BotStatsType } from '../schemas/bot-stats.schema';

@Injectable()
export class BotStatsRepository extends BaseRepository<BotStats> {
  constructor(@InjectModel(BotStats.name) readonly model: Model<BotStats>) {
    super(model, BotStats);
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
  ): Promise<BotStats[]> {
    const query = this.model
      .find({
        type: { $in: types },
        day: { $gte: from, $lte: to },
      })
      .sort({ $natural: 1 });
    return await this.execute(query, BotStats);
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
    return await this.model.aggregate([
      {
        $match: {
          day: { $gte: from, $lte: to },
          type: BotStatsType.popular,
        },
      },
      {
        $group: {
          _id: '$name',
          id: { $sum: 1 },
          value: { $sum: '$value' },
        },
      },
      {
        $sort: {
          value: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $addFields: { id: '$_id' },
      },
      {
        $project: { _id: 0 },
      },
    ]);
  }
}
