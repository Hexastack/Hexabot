/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { Subscriber } from '@/chat/schemas/subscriber.schema';
import { config } from '@/config';
import { BaseService } from '@/utils/generics/base-service';

import { BotStatsRepository } from '../repositories/bot-stats.repository';
import { BotStats, BotStatsType } from '../schemas/bot-stats.schema';

@Injectable()
export class BotStatsService extends BaseService<BotStats> {
  constructor(readonly repository: BotStatsRepository) {
    super(repository);
  }

  /**
   * Retrieves statistics for messages within a specified time range and of specified types.
   *
   * @param from - The start date for filtering messages.
   * @param to - The end date for filtering messages.
   * @param types - An array of message types (of type BotStatsType) to filter the statistics.
   *
   * @returns A promise that resolves to an array of `BotStats` objects representing the message statistics.
   */
  async findMessages(
    from: Date,
    to: Date,
    types: BotStatsType[],
  ): Promise<BotStats[]> {
    return await this.repository.findMessages(from, to, types);
  }

  /**
   * Retrieves the most popular blocks within a specified time range.
   * Popular blocks are those triggered the most frequently.
   *
   * @param  from - The start date of the time range.
   * @param  to - The end date of the time range.
   * @returns A promise that resolves with an array of popular blocks, each containing an `id` and the number of times it was triggered (`value`).
   */
  async findPopularBlocks(
    from: Date,
    to: Date,
  ): Promise<{ id: string; value: number }[]> {
    return await this.repository.findPopularBlocks(from, to);
  }

  /**
   * Handles the event to track user activity and emit statistics for loyalty, returning users, and retention.
   *
   * This method checks the last visit of the subscriber and emits relevant analytics events
   * based on configured thresholds for loyalty, returning users, and retention.
   *
   * @param {Subscriber} subscriber - The subscriber object that contains last visit and retention data.
   */
  @OnEvent('hook:user:lastvisit')
  handleLastVisit(subscriber: Subscriber) {
    const now = +new Date();
    if (subscriber.lastvisit) {
      // A loyal subscriber is a subscriber that comes back after some inactivity
      if (now - +subscriber.lastvisit > config.analytics.thresholds.loyalty) {
        this.eventEmitter.emit(
          'hook:stats:entry',
          BotStatsType.returning_users,
          'Loyalty',
          subscriber,
        );
      }

      // Returning subscriber is a subscriber that comes back after some inactivity
      if (now - +subscriber.lastvisit > config.analytics.thresholds.returning) {
        this.eventEmitter.emit(
          'hook:stats:entry',
          BotStatsType.returning_users,
          'Returning users',
          subscriber,
        );
      }
    }
    // Retention
    if (
      subscriber.retainedFrom &&
      now - +subscriber.retainedFrom > config.analytics.thresholds.retention
    ) {
      this.eventEmitter.emit(
        'hook:stats:entry',
        BotStatsType.retention,
        'Retentioned users',
      );
    }
  }

  /**
   * Handles the event to update bot statistics.
   *
   * @param type - The type of bot statistics being tracked (e.g., user messages, bot responses).
   * @param name - The name or identifier of the statistics entry (e.g., a specific feature or component being tracked).
   */
  @OnEvent('hook:stats:entry')
  async handleStatEntry(type: BotStatsType, name: string): Promise<void> {
    const day = new Date();
    day.setMilliseconds(0);
    day.setSeconds(0);
    day.setMinutes(0);
    day.setHours(0);

    try {
      const insight = await this.findOneOrCreate(
        { day: { $lte: day, $gte: day }, type, name },
        { day, type, name, value: 0 },
      );

      try {
        await this.updateOne(insight.id, { value: insight.value + 1 });
      } catch (err) {
        this.logger.error('Unable to update insight', err);
      }
    } catch (err) {
      this.logger.error('Unable to find or create insight', err);
    }
  }
}
