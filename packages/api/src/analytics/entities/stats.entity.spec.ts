/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { statsFixtures } from '@/utils/test/fixtures/stats';

import { StatsOrmEntity, StatsType } from './stats.entity';

describe('Stats entity helpers', () => {
  describe('toLines', () => {
    it('should transform the data based on the given types', () => {
      const result = StatsOrmEntity.toLines(
        [
          {
            ...statsFixtures[4],
            id: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as StatsOrmEntity,
          {
            ...statsFixtures[5],
            id: '2',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as StatsOrmEntity,
        ],
        [StatsType.incoming, StatsType.outgoing],
      );

      expect(result).toEqualPayload([
        {
          id: 1,
          name: StatsType.incoming,
          values: [
            {
              ...statsFixtures[4],
              date: statsFixtures[4].day,
            },
          ],
        },
        {
          id: 2,
          name: StatsType.outgoing,
          values: [
            {
              ...statsFixtures[5],
              date: statsFixtures[5].day,
            },
          ],
        },
      ]);
    });
  });
});
