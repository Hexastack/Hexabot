/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { BotStatsCreateDto } from '@/analytics/dto/bot-stats.dto';
import {
  BotStatsModel,
  BotStatsType,
} from '@/analytics/schemas/bot-stats.schema';

export const botstatsFixtures: BotStatsCreateDto[] = [
  {
    day: new Date('2023-11-01T23:00:00.000Z'),
    type: BotStatsType.all_messages,
    name: 'All Messages',
    value: 1580,
  },
  {
    day: new Date('2023-11-02T23:00:00.000Z'),
    type: BotStatsType.new_users,
    name: 'New users',
    value: 76,
  },
  {
    day: new Date('2023-11-03T22:00:00.000Z'),
    type: BotStatsType.popular,
    name: 'Global Fallback',
    value: 34,
  },
  {
    day: new Date('2023-11-04T23:00:00.000Z'),
    type: BotStatsType.new_conversations,
    name: 'New conversations',
    value: 492,
  },
  {
    day: new Date('2023-11-05T23:00:00.000Z'),
    type: BotStatsType.incoming,
    name: 'Incoming',
    value: 886,
  },
  {
    day: new Date('2023-11-07T23:00:00.000Z'),
    type: BotStatsType.outgoing,
    name: 'outgoing',
    value: 199,
  },
  {
    day: new Date('2023-11-03T23:00:00.000Z'),
    type: BotStatsType.popular,
    name: 'Global Fallback',
    value: 34,
  },
];

export const installBotStatsFixtures = async () => {
  const BotStats = mongoose.model(BotStatsModel.name, BotStatsModel.schema);
  return await BotStats.insertMany(botstatsFixtures);
};
