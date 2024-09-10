/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from '@/logger/logger.service';
import {
  botstatsFixtures,
  installBotStatsFixtures,
} from '@/utils/test/fixtures/botstats';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { BotStatsService } from './bot-stats.service';
import { BotStatsRepository } from '../repositories/bot-stats.repository';
import { BotStatsModel, BotStatsType } from '../schemas/bot-stats.schema';

describe('BotStatsService', () => {
  let botStatsService: BotStatsService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installBotStatsFixtures),
        MongooseModule.forFeature([BotStatsModel]),
      ],
      providers: [
        LoggerService,
        BotStatsService,
        BotStatsRepository,
        EventEmitter2,
      ],
    }).compile();
    botStatsService = module.get<BotStatsService>(BotStatsService);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

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
