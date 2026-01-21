/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { StatsCreateDto } from '@/analytics/dto/stats.dto';
import { StatsOrmEntity, StatsType } from '@/analytics/entities/stats.entity';

export const statsFixtures: StatsCreateDto[] = [
  {
    day: new Date('2023-11-01T23:00:00.000Z'),
    type: StatsType.all_messages,
    name: 'All Messages',
    value: 1580,
  },
  {
    day: new Date('2023-11-02T23:00:00.000Z'),
    type: StatsType.new_users,
    name: 'New users',
    value: 76,
  },
  {
    day: new Date('2023-11-03T22:00:00.000Z'),
    type: StatsType.returning_users,
    name: 'Returning users',
    value: 34,
  },
  {
    day: new Date('2023-11-04T23:00:00.000Z'),
    type: StatsType.retention,
    name: 'Retentioned users',
    value: 492,
  },
  {
    day: new Date('2023-11-05T23:00:00.000Z'),
    type: StatsType.incoming,
    name: 'Incoming',
    value: 886,
  },
  {
    day: new Date('2023-11-07T23:00:00.000Z'),
    type: StatsType.outgoing,
    name: 'outgoing',
    value: 199,
  },
  {
    day: new Date('2023-11-03T23:00:00.000Z'),
    type: StatsType.echo,
    name: 'Echo',
    value: 12,
  },
];

export const installStatsFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(StatsOrmEntity);
  const entities = repository.create(statsFixtures);
  await repository.save(entities);
};
