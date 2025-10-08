/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ModelDefinition, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { BaseSchema } from '@/utils/generics/base-schema';
import { LifecycleHookManager } from '@/utils/generics/lifecycle-hook-manager';
import { THydratedDocument } from '@/utils/types/filter.types';

export enum BotStatsType {
  outgoing = 'outgoing',
  new_users = 'new_users',
  all_messages = 'all_messages',
  incoming = 'incoming',
  existing_conversations = 'existing_conversations',
  popular = 'popular',
  new_conversations = 'new_conversations',
  returning_users = 'returning_users',
  retention = 'retention',
  echo = 'echo',
}

export type ToLinesType = {
  id: number;
  name: BotStatsType;
  values: any[];
};

@Schema({ timestamps: true })
export class BotStats extends BaseSchema {
  /**
   *  Type of the captured insight.
   */
  @Prop({
    type: String,
    required: true,
  })
  type: BotStatsType;

  /**
   * Day based granularity for the captured insights.
   */
  @Prop({
    type: Date,
    required: true,
  })
  day: Date;

  /**
   *  Total value of the insight for the whole chosen granularity.
   */

  @Prop({ type: Number, default: 0 })
  value: number;

  /**
   *  name of the insight (e.g: incoming messages).
   */
  @Prop({ type: String, required: true })
  name: string;

  /**
   * Converts bot statistics data into an line chart data format.
   *
   * @param stats - The array of bot statistics.
   * @param  types - The array of bot statistics types.
   * @returns An array of data representing the bot statistics data.
   */
  static toLines(stats: BotStats[], types: BotStatsType[]): ToLinesType[] {
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

    const result = stats.reduce((acc, stat: BotStats & { date: Date }) => {
      stat.date = stat.day;
      acc[index[stat.type]].values.push(stat);
      return acc;
    }, data);

    return result;
  }

  /**
   * Converts fetched stats to a bar chart compatible data format
   *
   * @param stats - Array of objects, each contaning at least an id and a value
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

export type BotStatsDocument = THydratedDocument<BotStats>;

export const BotStatsModel: ModelDefinition = LifecycleHookManager.attach({
  name: BotStats.name,
  schema: SchemaFactory.createForClass(BotStats).index({ day: 1, type: 1 }),
});

export default BotStatsModel.schema;
