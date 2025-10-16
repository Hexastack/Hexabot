/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { botstatsFixtures } from '@/utils/test/fixtures/botstats';

import { BotStats, BotStatsType } from './bot-stats.entity';

describe('BotStats entity helpers', () => {
  describe('toLines', () => {
    it('should transform the data based on the given types', () => {
      const result = BotStats.toLines(
        [
          {
            ...botstatsFixtures[4],
            id: '1',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as BotStats,
          {
            ...botstatsFixtures[5],
            id: '2',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as BotStats,
        ],
        [BotStatsType.incoming, BotStatsType.outgoing],
      );

      expect(result).toEqualPayload([
        {
          id: 1,
          name: BotStatsType.incoming,
          values: [
            {
              ...botstatsFixtures[4],
              date: botstatsFixtures[4].day,
            },
          ],
        },
        {
          id: 2,
          name: BotStatsType.outgoing,
          values: [
            {
              ...botstatsFixtures[5],
              date: botstatsFixtures[5].day,
            },
          ],
        },
      ]);
    });
  });
});
