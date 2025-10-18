/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { Subscriber } from '@/chat/schemas/subscriber.schema';
import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { BotStatsDto, BotStatsTransformerDto } from '../dto/bot-stats.dto';
import { BotStatsOrmEntity, BotStatsType } from '../entities/bot-stats.entity';
import { BotStatsRepository } from '../repositories/bot-stats.repository';

@Injectable()
export class BotStatsService extends BaseOrmService<
  BotStatsOrmEntity,
  BotStatsTransformerDto,
  BotStatsDto,
  BotStatsRepository
> {
  constructor(
    readonly repository: BotStatsRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {
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
  ): Promise<BotStatsOrmEntity[]> {
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
        { day, type, name },
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
