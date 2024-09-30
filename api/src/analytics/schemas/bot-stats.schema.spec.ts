/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { botstatsFixtures } from '@/utils/test/fixtures/botstats';

import { BotStats, BotStatsType } from './bot-stats.schema';

describe('toLines', () => {
  it('should transform the data based on the given types', () => {
    const result = BotStats.toLines(
      [
        {
          ...botstatsFixtures[4],
          id: '1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          ...botstatsFixtures[5],
          id: '2',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
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
