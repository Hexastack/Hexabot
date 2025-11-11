/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { BotStatsCreateDto } from '@/analytics/dto/bot-stats.dto';
import {
  BotStatsOrmEntity,
  BotStatsType,
} from '@/analytics/entities/bot-stats.entity';

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

export const installBotStatsFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(BotStatsOrmEntity);
  const entities = repository.create(botstatsFixtures);
  await repository.save(entities);
};
