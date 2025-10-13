/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  botstatsFixtures,
  installBotStatsFixtures,
} from '@/utils/test/fixtures/botstats';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { BotStatsType } from '../schemas/bot-stats.schema';

import { BotStatsService } from './bot-stats.service';

describe('BotStatsService', () => {
  let botStatsService: BotStatsService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installBotStatsFixtures)],
      providers: [BotStatsService],
    });
    [botStatsService] = await getMocks([BotStatsService]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findMessages', () => {
    it('should return all messages', async () => {
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findMessages(
        from,
        to,
        Object.values(BotStatsType),
      );

      expect(result).toEqualPayload(botstatsFixtures);
    });

    it('should return messages between the given date range', async () => {
      const from = botstatsFixtures[0].day;
      const to = botstatsFixtures[2].day;
      const result = await botStatsService.findMessages(
        from,
        to,
        Object.values(BotStatsType),
      );
      expect(result).toEqualPayload(botstatsFixtures.slice(0, 3));
    });

    it('should return messages of a given type', async () => {
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findMessages(from, to, [
        BotStatsType.outgoing,
      ]);
      expect(result).toEqualPayload([botstatsFixtures[5]]);
    });

    it('should return messages of type conversation', async () => {
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findMessages(from, to, [
        BotStatsType.new_conversations,
        BotStatsType.existing_conversations,
      ]);
      expect(result).toEqualPayload([botstatsFixtures[3]]);
    });

    it('should return messages of type audiance', async () => {
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findMessages(from, to, [
        BotStatsType.new_users,
        BotStatsType.returning_users,
        BotStatsType.retention,
      ]);
      expect(result).toEqualPayload([botstatsFixtures[1]]);
    });
  });

  describe('findPopularBlocks', () => {
    it('should return popular blocks', async () => {
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findPopularBlocks(from, to);

      expect(result).toEqual([
        {
          id: 'Global Fallback',
          value: 68,
        },
      ]);
    });
  });
});
