/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

export enum BotStatsType {
  outgoing = 'outgoing',
  new_users = 'new_users',
  all_messages = 'all_messages',
  incoming = 'incoming',
  returning_users = 'returning_users',
  retention = 'retention',
  echo = 'echo',
}

export type ToLinesType = {
  id: number;
  name: BotStatsType;
  values: any[];
};

@Entity({ name: 'bot_stats' })
@Index(['day', 'type', 'name'], { unique: true })
export class BotStatsOrmEntity extends BaseOrmEntity {
  /**
   * Type of the captured insight.
   */
  @EnumColumn({ enum: BotStatsType })
  type!: BotStatsType;

  /**
   * Day based granularity for the captured insights.
   */
  @DatetimeColumn()
  day!: Date;

  /**
   * Total value of the insight for the whole chosen granularity.
   */
  @Column({ default: 0 })
  value!: number;

  /**
   * Name of the insight (e.g: incoming messages).
   */
  @Column()
  name!: string;

  /**
   * Converts bot statistics data into a line chart data format.
   *
   * @param stats - The array of bot statistics.
   * @param types - The array of bot statistics types.
   * @returns An array of data representing the bot statistics data.
   */
  static toLines(
    stats: BotStatsOrmEntity[],
    types: BotStatsType[],
  ): ToLinesType[] {
    const data = types.map((type, index) => {
      return {
        id: index + 1,
        name: type,
        values: [],
      } as ToLinesType;
    });
    const index: { [dataName: string]: number } = data.reduce(
      (acc, curr, i) => {
        acc[curr.name] = i;

        return acc;
      },
      {},
    );
    const result = stats.reduce(
      (acc, stat: BotStatsOrmEntity & { date: Date }) => {
        stat.date = stat.day;
        acc[index[stat.type]].values.push(stat);

        return acc;
      },
      data,
    );

    return result;
  }

  /**
   * Converts fetched stats to a bar chart compatible data format
   *
   * @param stats - Array of objects, each containing at least an id and a value
   * @returns BarChart compatible data
   */
  static toBars(
    stats: { id: string; value: number }[],
  ): { id: string; name: string; value: number }[] {
    return stats.map((stat) => {
      return {
        ...stat,
        name: stat.id,
      };
    });
  }
}
