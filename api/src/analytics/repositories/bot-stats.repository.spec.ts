/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  botstatsFixtures,
  installBotStatsFixtures,
} from '@/utils/test/fixtures/botstats';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { BotStats, BotStatsType } from '../schemas/bot-stats.schema';

import { BotStatsRepository } from './bot-stats.repository';

describe('BotStatsRepository', () => {
  let botStatsRepository: BotStatsRepository;
  let botStatsModel: Model<BotStats>;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installBotStatsFixtures)],
      providers: [BotStatsRepository],
    });
    [botStatsRepository, botStatsModel] = await getMocks([
      BotStatsRepository,
      getModelToken(BotStats.name),
    ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findMessages', () => {
    it('should return messages', async () => {
      jest.spyOn(botStatsModel, 'find');
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const types = [
        BotStatsType.all_messages,
        BotStatsType.incoming,
        BotStatsType.outgoing,
      ];
      const result = await botStatsRepository.findMessages(from, to, types);

      expect(botStatsModel.find).toHaveBeenCalledWith({
        type: {
          $in: [
            BotStatsType.all_messages,
            BotStatsType.incoming,
            BotStatsType.outgoing,
          ],
        },
        day: { $gte: from, $lte: to },
      });

      expect(result).toEqualPayload(
        botstatsFixtures.filter(({ type }) => types.includes(type)),
      );
    });

    it('should return messages of a specific period', async () => {
      jest.spyOn(botStatsModel, 'find');
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-03T23:00:00.000Z');
      const types = [
        BotStatsType.all_messages,
        BotStatsType.incoming,
        BotStatsType.outgoing,
      ];
      const result = await botStatsRepository.findMessages(from, to, types);

      expect(botStatsModel.find).toHaveBeenCalledWith({
        type: {
          $in: [
            BotStatsType.all_messages,
            BotStatsType.incoming,
            BotStatsType.outgoing,
          ],
        },
        day: { $gte: from, $lte: to },
      });

      expect(result).toEqualPayload([botstatsFixtures[0]]);
    });

    it('should return conversation statistics', async () => {
      jest.spyOn(botStatsModel, 'find');
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const result = await botStatsRepository.findMessages(from, to, [
        BotStatsType.new_conversations,
        BotStatsType.existing_conversations,
      ]);

      expect(botStatsModel.find).toHaveBeenCalledWith({
        type: {
          $in: [
            BotStatsType.new_conversations,
            BotStatsType.existing_conversations,
          ],
        },
        day: { $gte: from, $lte: to },
      });

      expect(result).toEqualPayload([botstatsFixtures[3]]);
    });

    it('should return audiance statistics', async () => {
      jest.spyOn(botStatsModel, 'find');
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const result = await botStatsRepository.findMessages(from, to, [
        BotStatsType.new_users,
        BotStatsType.returning_users,
        BotStatsType.retention,
      ]);

      expect(botStatsModel.find).toHaveBeenCalledWith({
        type: {
          $in: [
            BotStatsType.new_users,
            BotStatsType.returning_users,
            BotStatsType.retention,
          ],
        },
        day: { $gte: from, $lte: to },
      });

      expect(result).toEqualPayload([botstatsFixtures[1]]);
    });

    it('should return statistics of a given type', async () => {
      jest.spyOn(botStatsModel, 'find');
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const result = await botStatsRepository.findMessages(from, to, [
        BotStatsType.incoming,
      ]);

      expect(botStatsModel.find).toHaveBeenCalledWith({
        type: {
          $in: [BotStatsType.incoming],
        },
        day: { $gte: from, $lte: to },
      });

      expect(result).toEqualPayload([botstatsFixtures[4]]);
    });
  });

  describe('findPopularBlocks', () => {
    it('should return popular blocks', async () => {
      jest.spyOn(botStatsModel, 'aggregate');
      const from = new Date('2023-11-01T22:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const result = await botStatsRepository.findPopularBlocks(from, to);

      expect(botStatsModel.aggregate).toHaveBeenCalled();

      expect(result).toEqual([
        {
          id: 'Global Fallback',
          value: 68,
        },
      ]);
    });
  });
});
