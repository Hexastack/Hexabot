/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from '@nestjs/event-emitter';

import {
  botstatsFixtures,
  installBotStatsFixturesTypeOrm,
} from '@/utils/test/fixtures/botstats';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { BotStats, BotStatsType } from '../entities/bot-stats.entity';
import { BotStatsRepository } from '../repositories/bot-stats.repository';

import { BotStatsService } from './bot-stats.service';

describe('BotStatsService', () => {
  let botStatsService: BotStatsService;
  let botStatsRepository: BotStatsRepository;
  let module: TestingModule;

  const sortByDayAndType = <T extends { day: Date; type: string }>(items: T[]) =>
    [...items].sort((left, right) => {
      const leftTime = new Date(left.day).getTime();
      const rightTime = new Date(right.day).getTime();
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }
      return left.type.localeCompare(right.type);
    });

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [BotStatsService, EventEmitter2],
      typeorm: {
        entities: [BotStats],
        fixtures: installBotStatsFixturesTypeOrm,
      },
    });
    module = testingModule;
    [botStatsService, botStatsRepository] = await getMocks([
      BotStatsService,
      BotStatsRepository,
    ]);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findMessages', () => {
    it('should return all messages', async () => {
      jest.spyOn(botStatsRepository, 'findMessages');
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findMessages(
        from,
        to,
        Object.values(BotStatsType),
      );

      expect(botStatsRepository.findMessages).toHaveBeenCalledWith(
        from,
        to,
        Object.values(BotStatsType),
      );
      expect(sortByDayAndType(result)).toEqualPayload(
        sortByDayAndType(botstatsFixtures),
      );
    });

    it('should return messages between the given date range', async () => {
      jest.spyOn(botStatsRepository, 'findMessages');
      const from = botstatsFixtures[0].day;
      const to = botstatsFixtures[2].day;
      const result = await botStatsService.findMessages(
        from,
        to,
        Object.values(BotStatsType),
      );
      expect(botStatsRepository.findMessages).toHaveBeenCalledWith(
        from,
        to,
        Object.values(BotStatsType),
      );
      expect(sortByDayAndType(result)).toEqualPayload(
        sortByDayAndType(botstatsFixtures.slice(0, 3)),
      );
    });

    it('should return messages of a given type', async () => {
      jest.spyOn(botStatsRepository, 'findMessages');
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findMessages(from, to, [
        BotStatsType.outgoing,
      ]);
      expect(botStatsRepository.findMessages).toHaveBeenCalledWith(
        from,
        to,
        [BotStatsType.outgoing],
      );
      expect(result).toEqualPayload([botstatsFixtures[5]]);
    });

    it('should return messages of type conversation', async () => {
      jest.spyOn(botStatsRepository, 'findMessages');
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findMessages(from, to, [
        BotStatsType.new_conversations,
        BotStatsType.existing_conversations,
      ]);
      expect(botStatsRepository.findMessages).toHaveBeenCalledWith(
        from,
        to,
        [BotStatsType.new_conversations, BotStatsType.existing_conversations],
      );
      expect(result).toEqualPayload([botstatsFixtures[3]]);
    });

    it('should return messages of type audiance', async () => {
      jest.spyOn(botStatsRepository, 'findMessages');
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findMessages(from, to, [
        BotStatsType.new_users,
        BotStatsType.returning_users,
        BotStatsType.retention,
      ]);
      expect(botStatsRepository.findMessages).toHaveBeenCalledWith(
        from,
        to,
        [
          BotStatsType.new_users,
          BotStatsType.returning_users,
          BotStatsType.retention,
        ],
      );
      expect(result).toEqualPayload([botstatsFixtures[1]]);
    });
  });

  describe('findPopularBlocks', () => {
    it('should return popular blocks', async () => {
      jest.spyOn(botStatsRepository, 'findPopularBlocks');
      const from = botstatsFixtures[0].day;
      const to = new Date();
      const result = await botStatsService.findPopularBlocks(from, to);

      expect(botStatsRepository.findPopularBlocks).toHaveBeenCalledWith(
        from,
        to,
      );
      expect(result).toEqual([
        {
          id: 'Global Fallback',
          value: 68,
        },
      ]);
    });
  });
});
