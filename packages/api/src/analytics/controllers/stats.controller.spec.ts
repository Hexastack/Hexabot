/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestingModule } from '@nestjs/testing';

import {
  installStatsFixturesTypeOrm,
  statsFixtures,
} from '@/utils/test/fixtures/stats';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { StatsType } from '../entities/stats.entity';

import { StatsController } from './stats.controller';

describe('StatsController', () => {
  let statsController: StatsController;
  let module: TestingModule;

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [StatsController],
      providers: [EventEmitter2],
      typeorm: {
        fixtures: installStatsFixturesTypeOrm,
      },
    });
    module = testingModule;
    [statsController] = await getMocks([StatsController]);
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
    it('should return no messages in the given date range', async () => {
      const result = await statsController.findMessages({
        from: new Date('2024-11-01T23:00:00.000Z'),
        to: new Date('2024-11-05T23:00:00.000Z'),
      });
      expect(result).toHaveLength(3);
      expect(result).toEqualPayload([
        {
          id: 1,
          name: StatsType.all_messages,
          values: [],
        },
        {
          id: 2,
          name: StatsType.incoming,
          values: [],
        },
        {
          id: 3,
          name: StatsType.outgoing,
          values: [],
        },
      ]);
    });

    it('should return messages in the given date range', async () => {
      const from = new Date('2023-11-01T23:00:00.000Z');
      const to = new Date('2023-11-05T23:00:00.000Z');
      const result = await statsController.findMessages({
        from,
        to,
      });
      expect(result).toEqualPayload([
        {
          id: 1,
          name: StatsType.all_messages,
          values: [
            {
              ...statsFixtures[0],
              date: statsFixtures[0].day,
            },
          ],
        },
        {
          id: 2,
          name: StatsType.incoming,
          values: [
            {
              ...statsFixtures[4],
              date: statsFixtures[4].day,
            },
          ],
        },
        {
          id: 3,
          name: StatsType.outgoing,
          values: [],
        },
      ]);
    });
  });

  describe('datum', () => {
    it('should return messages of a given type', async () => {
      const result = await statsController.datum({
        from: new Date('2023-11-06T23:00:00.000Z'),
        to: new Date('2023-11-08T23:00:00.000Z'),
        type: StatsType.outgoing,
      });

      expect(result).toEqualPayload([
        {
          id: 1,
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

  describe('audiance', () => {
    it('should return audiance messages', async () => {
      const result = await statsController.audiance({
        from: new Date('2023-11-01T23:00:00.000Z'),
        to: new Date('2023-11-08T23:00:00.000Z'),
      });

      expect(result).toEqualPayload([
        {
          id: 1,
          name: StatsType.new_users,
          values: [
            {
              ...statsFixtures[1],
              date: statsFixtures[1].day,
            },
          ],
        },
        {
          id: 2,
          name: StatsType.returning_users,
          values: [
            {
              ...statsFixtures[2],
              date: statsFixtures[2].day,
            },
          ],
        },
        {
          id: 3,
          name: StatsType.retention,
          values: [
            {
              ...statsFixtures[3],
              date: statsFixtures[3].day,
            },
          ],
        },
      ]);
    });
  });
});
