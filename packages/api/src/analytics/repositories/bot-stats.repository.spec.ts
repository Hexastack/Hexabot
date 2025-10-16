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

import { BotStatsRepository } from './bot-stats.repository';

describe('BotStatsRepository (TypeORM)', () => {
  let botStatsRepository: BotStatsRepository;
  let module: TestingModule;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [BotStatsRepository, EventEmitter2],
      typeorm: {
        entities: [BotStats],
        fixtures: installBotStatsFixturesTypeOrm,
      },
    });

    module = testing.module;
    botStatsRepository = module.get(BotStatsRepository);
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findMessages', () => {
    it('should return messages', async () => {
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const types = [
        BotStatsType.all_messages,
        BotStatsType.incoming,
        BotStatsType.outgoing,
      ];
      const result = await botStatsRepository.findMessages(from, to, types);

      expect(result).toEqualPayload(
        botstatsFixtures.filter(({ type }) => types.includes(type)),
      );
    });

    it('should return messages of a specific period', async () => {
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-03T23:00:00.000Z');
      const types = [
        BotStatsType.all_messages,
        BotStatsType.incoming,
        BotStatsType.outgoing,
      ];
      const result = await botStatsRepository.findMessages(from, to, types);

      expect(result).toEqualPayload([botstatsFixtures[0]]);
    });

    it('should return conversation statistics', async () => {
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const result = await botStatsRepository.findMessages(from, to, [
        BotStatsType.new_conversations,
        BotStatsType.existing_conversations,
      ]);

      expect(result).toEqualPayload([botstatsFixtures[3]]);
    });

    it('should return audiance statistics', async () => {
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const result = await botStatsRepository.findMessages(from, to, [
        BotStatsType.new_users,
        BotStatsType.returning_users,
        BotStatsType.retention,
      ]);

      expect(result).toEqualPayload([botstatsFixtures[1]]);
    });

    it('should return statistics of a given type', async () => {
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const result = await botStatsRepository.findMessages(from, to, [
        BotStatsType.incoming,
      ]);

      expect(result).toEqualPayload([botstatsFixtures[4]]);
    });
  });

  describe('findPopularBlocks', () => {
    it('should return popular blocks', async () => {
      const from = new Date('2023-11-01T22:00:00.000Z');
      const to = new Date('2023-11-07T23:00:00.000Z');
      const result = await botStatsRepository.findPopularBlocks(from, to);

      expect(result).toEqual([
        {
          id: 'Global Fallback',
          value: 68,
        },
      ]);
    });
  });
});
