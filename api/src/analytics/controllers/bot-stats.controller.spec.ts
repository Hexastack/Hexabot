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

import { BotStatsController } from './bot-stats.controller';
import { BotStatsRepository } from '../repositories/bot-stats.repository';
import { BotStatsModel, BotStatsType } from '../schemas/bot-stats.schema';
import { BotStatsService } from '../services/bot-stats.service';

describe('BotStatsController', () => {
  let botStatsController: BotStatsController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BotStatsController],
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
    botStatsController = module.get<BotStatsController>(BotStatsController);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findMessages', () => {
    it('should return no messages in the given date range', async () => {
      const result = await botStatsController.findMessages({
        from: new Date('2024-11-01T23:00:00.000Z'),
        to: new Date('2024-11-05T23:00:00.000Z'),
      });
      expect(result).toHaveLength(3);
      expect(result).toEqualPayload([
        {
          id: 1,
          name: BotStatsType.all_messages,
          values: [],
        },
        {
          id: 2,
          name: BotStatsType.incoming,
          values: [],
        },
        {
          id: 3,
          name: BotStatsType.outgoing,
          values: [],
        },
      ]);
    });

    it('should return messages in the given date range', async () => {
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-05T23:00:00.000Z');
      const result = await botStatsController.findMessages({
        from,
        to,
      });
      expect(result).toEqualPayload([
        {
          id: 1,
          name: BotStatsType.all_messages,
          values: [
            {
              ...botstatsFixtures[0],
              date: botstatsFixtures[0].day,
            },
          ],
        },
        {
          id: 2,
          name: BotStatsType.incoming,
          values: [
            {
              ...botstatsFixtures[4],
              date: botstatsFixtures[4].day,
            },
          ],
        },
        {
          id: 3,
          name: BotStatsType.outgoing,
          values: [],
        },
      ]);
    });
  });

  describe('datum', () => {
    it('should return messages of a given type', async () => {
      const result = await botStatsController.datum({
        from: new Date('2023-11-06T23:00:00.000Z'),
        to: new Date('2023-11-08T23:00:00.000Z'),
        type: BotStatsType.outgoing,
      });

      expect(result).toEqualPayload([
        {
          id: 1,
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

  describe('conversation', () => {
    it('should return conversation messages', async () => {
      const result = await botStatsController.conversation({
        from: new Date('2023-11-04T23:00:00.000Z'),
        to: new Date('2023-11-06T23:00:00.000Z'),
      });

      expect(result).toEqualPayload([
        {
          id: 1,
          name: BotStatsType.new_conversations,
          values: [
            {
              ...botstatsFixtures[3],
              date: botstatsFixtures[3].day,
            },
          ],
        },
        {
          id: 2,
          name: BotStatsType.existing_conversations,
          values: [],
        },
      ]);
    });
  });

  describe('audiance', () => {
    it('should return audiance messages', async () => {
      const result = await botStatsController.audiance({
        from: new Date('2023-11-01T23:00:00.000Z'),
        to: new Date('2023-11-08T23:00:00.000Z'),
      });

      expect(result).toEqualPayload([
        {
          id: 1,
          name: BotStatsType.new_users,
          values: [
            {
              ...botstatsFixtures[1],
              date: botstatsFixtures[1].day,
            },
          ],
        },
        {
          id: 2,
          name: BotStatsType.returning_users,
          values: [],
        },
        {
          id: 3,
          name: BotStatsType.retention,
          values: [],
        },
      ]);
    });
  });

  describe('popularBlocks', () => {
    it('should return popular blocks', async () => {
      const result = await botStatsController.popularBlocks({
        from: new Date('2023-11-01T23:00:00.000Z'),
        to: new Date('2023-11-08T23:00:00.000Z'),
      });

      expect(result).toEqual([
        {
          name: 'Global Fallback',
          id: 'Global Fallback',
          value: 68,
        },
      ]);
    });
  });
});
