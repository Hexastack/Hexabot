/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { statsSchema, statsFullSchema, Stats } from '@hexabot-ai/types';
import { Column, Entity, Index } from 'typeorm';

import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { EnumColumn } from '@/database/decorators/enum-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { StatsDto } from '../dto/stats.dto';
import { StatsType } from '../enums/stats-type.enum';

export { StatsType };

export type ToLinesType = {
  id: number;
  name: StatsType;
  values: any[];
};

@Entity({ name: 'stats' })
@Index(['day', 'type', 'name'], { unique: true })
export class StatsOrmEntity extends BaseOrmEntity<StatsDto> {
  plainCls = statsSchema;

  fullCls = statsFullSchema;

  /**
   * Type of the captured insight.
   */
  @EnumColumn({ enum: StatsType })
  type!: StatsType;

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
  static toLines(stats: Stats[], types: StatsType[]): ToLinesType[] {
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
    const result = stats.reduce((acc, stat: Stats) => {
      acc[index[stat.type]].values.push({ ...stat, date: stat.day });

      return acc;
    }, data);

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
