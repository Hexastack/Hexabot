/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { TestingModule } from '@nestjs/testing';

import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { MessageService } from '@/chat/services/message.service';
import { EHook } from '@/utils';
import {
  installStatsFixturesTypeOrm,
  statsFixtures,
} from '@/utils/test/fixtures/stats';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { EmitEventProps } from '@/utils/types/entity-event.types';
import { WorkflowRunService } from '@/workflow/services/workflow-run.service';
import { WorkflowService } from '@/workflow/services/workflow.service';

import { StatsType } from '../entities/stats.entity';
import { StatsRepository } from '../repositories/stats.repository';

import { StatsService } from './stats.service';

describe('StatsService', () => {
  let statsService: StatsService;
  let statsRepository: StatsRepository;
  let module: TestingModule;
  let eventEmitter: EventEmitter2;
  const workflowService = {
    count: jest.fn(),
  } as jest.Mocked<Pick<WorkflowService, 'count'>>;
  const workflowRunService = {
    count: jest.fn(),
  } as jest.Mocked<Pick<WorkflowRunService, 'count'>>;
  const messageService = {
    count: jest.fn(),
  } as jest.Mocked<Pick<MessageService, 'count'>>;
  const sortByDayAndType = <T extends { day: Date; type: string }>(
    items: T[],
  ) =>
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
      providers: [
        StatsService,
        { provide: WorkflowService, useValue: workflowService },
        { provide: WorkflowRunService, useValue: workflowRunService },
        { provide: MessageService, useValue: messageService },
      ],
      typeorm: {
        fixtures: installStatsFixturesTypeOrm,
      },
    });
    module = testingModule;
    [statsService, statsRepository] = await getMocks([
      StatsService,
      StatsRepository,
    ]);
    eventEmitter = module.get(EventEmitter2);
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
      jest.spyOn(statsRepository, 'findMessages');
      const from = statsFixtures[0].day;
      const to = new Date();
      const result = await statsService.findMessages(
        from,
        to,
        Object.values(StatsType),
      );

      expect(statsRepository.findMessages).toHaveBeenCalledWith(
        from,
        to,
        Object.values(StatsType),
      );
      expect(sortByDayAndType(result)).toEqualPayload(
        sortByDayAndType(statsFixtures),
      );
    });

    it('should return messages between the given date range', async () => {
      jest.spyOn(statsRepository, 'findMessages');
      const from = statsFixtures[0].day;
      const to = statsFixtures[2].day;
      const result = await statsService.findMessages(
        from,
        to,
        Object.values(StatsType),
      );
      expect(statsRepository.findMessages).toHaveBeenCalledWith(
        from,
        to,
        Object.values(StatsType),
      );
      expect(sortByDayAndType(result)).toEqualPayload(
        sortByDayAndType(statsFixtures.slice(0, 3)),
      );
    });

    it('should return messages of a given type', async () => {
      jest.spyOn(statsRepository, 'findMessages');
      const from = statsFixtures[0].day;
      const to = new Date();
      const result = await statsService.findMessages(from, to, [
        StatsType.outgoing,
      ]);
      expect(statsRepository.findMessages).toHaveBeenCalledWith(from, to, [
        StatsType.outgoing,
      ]);
      expect(result).toEqualPayload([statsFixtures[5]]);
    });

    it('should return messages of type audiance', async () => {
      jest.spyOn(statsRepository, 'findMessages');
      const from = statsFixtures[0].day;
      const to = new Date();
      const result = await statsService.findMessages(from, to, [
        StatsType.new_users,
        StatsType.returning_users,
        StatsType.retention,
      ]);
      expect(statsRepository.findMessages).toHaveBeenCalledWith(from, to, [
        StatsType.new_users,
        StatsType.returning_users,
        StatsType.retention,
      ]);
      expect(result).toEqualPayload(statsFixtures.slice(1, 4));
    });
  });

  describe('handleSubscriberPreUpdate', () => {
    const buildSubscriber = (
      partial: Partial<SubscriberOrmEntity>,
    ): SubscriberOrmEntity =>
      ({
        id: 'subscriber-id',
        first_name: 'John',
        last_name: 'Doe',
        channel: {} as any,
        assignedTo: null,
        assignedToId: null,
        ...partial,
      }) as unknown as SubscriberOrmEntity;
    const buildEvent = ({
      entity,
      databaseEntity,
      updatedColumns = ['assignedTo'],
    }: {
      entity: Partial<SubscriberOrmEntity>;
      databaseEntity: Partial<SubscriberOrmEntity>;
      updatedColumns?: string[];
    }): EmitEventProps<SubscriberOrmEntity, EHook.preUpdate> =>
      ({
        entity: buildSubscriber(entity),
        action: EHook.preUpdate,
        payload: entity,
        databaseEntity: buildSubscriber(databaseEntity),
        updatedColumns: updatedColumns.map(
          (propertyName) =>
            ({
              propertyName,
            }) as any,
        ),
        updatedRelations: [],
      }) as any;

    it('should emit passation analytics when subscriber gets newly assigned', () => {
      const emitSpy = jest.spyOn(eventEmitter, 'emit');
      const event = buildEvent({
        entity: {
          assignedTo: { id: 'user-id' } as any,
        },
        databaseEntity: { assignedTo: null },
      });

      statsService.handleSubscriberPreUpdate(event);

      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(
        'hook:analytics:passation',
        expect.objectContaining({ id: 'subscriber-id' }),
        true,
      );
    });
  });

  describe('getSummary', () => {
    it('should aggregate workflow, run, success, and message stats', async () => {
      workflowService.count.mockResolvedValue(4);
      workflowRunService.count
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(12)
        .mockResolvedValueOnce(8);
      messageService.count.mockResolvedValue(105);

      const result = await statsService.getSummary();

      expect(result).toEqual({
        totalWorkflows: 4,
        totalRunsLast24h: 20,
        successRateLast24h: 0.6,
        totalMessagesLast24h: 105,
      });
      expect(workflowService.count).toHaveBeenCalledTimes(1);
      expect(workflowRunService.count).toHaveBeenCalledTimes(3);
      expect(messageService.count).toHaveBeenCalledTimes(1);
    });
  });
});
