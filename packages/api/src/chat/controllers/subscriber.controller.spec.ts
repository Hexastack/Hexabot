/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { ConversationOrmEntity } from '@/chat/entities/conversation.entity';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { LabelRepository } from '@/chat/repositories/label.repository';
import { SubscriberRepository } from '@/chat/repositories/subscriber.repository';
import { LabelService } from '@/chat/services/label.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import {
  installSubscriberFixturesTypeOrm,
  subscriberFixtures,
} from '@hexabot/dev/fixtures/subscriber';
import { closeTypeOrmConnections } from '@hexabot/dev/test';
import { buildTestingMocks } from '@hexabot/dev/utils';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { Subscriber, SubscriberFull } from '../dto/subscriber.dto';

import { SubscriberController } from './subscriber.controller';

describe('SubscriberController (TypeORM)', () => {
  let module: TestingModule;
  let subscriberController: SubscriberController;
  let subscriberService: SubscriberService;

  let totalSubscribers: number;
  let plainSubscribers: Subscriber[];
  let populatedSubscribers: SubscriberFull[];
  let referencePlain: Subscriber;
  let referencePopulated: SubscriberFull;

  const attachmentServiceMock: Partial<AttachmentService> = {
    download: jest.fn(),
    store: jest.fn(),
    readAsBuffer: jest.fn(),
    readAsStream: jest.fn(),
  };
  const websocketGatewayMock: Partial<WebsocketGateway> = {
    joinNotificationSockets: jest.fn(),
  };
  const defaultOrder = { order: { createdAt: 'ASC' as const } };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [SubscriberController],
      providers: [
        SubscriberService,
        SubscriberRepository,
        LabelService,
        LabelRepository,
        {
          provide: AttachmentService,
          useValue: attachmentServiceMock,
        },
        {
          provide: WebsocketGateway,
          useValue: websocketGatewayMock,
        },
      ],
      typeorm: {
        entities: [
          SubscriberOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          BlockOrmEntity,
          CategoryOrmEntity,
          ConversationOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          AttachmentOrmEntity,
        ],
        fixtures: installSubscriberFixturesTypeOrm,
      },
    });

    module = testing.module;

    [subscriberController, subscriberService] = await testing.getMocks([
      SubscriberController,
      SubscriberService,
    ]);

    totalSubscribers = await subscriberService.count();
    plainSubscribers = await subscriberService.find(defaultOrder);
    populatedSubscribers =
      await subscriberService.findAndPopulate(defaultOrder);

    const targetFirstName = subscriberFixtures[0]?.first_name ?? null;

    referencePlain =
      plainSubscribers.find(
        (subscriber) => subscriber.first_name === targetFirstName,
      ) ?? plainSubscribers[0];

    referencePopulated =
      populatedSubscribers.find(
        (subscriber) => subscriber.id === referencePlain.id,
      ) ?? populatedSubscribers[0];

    if (!referencePlain || !referencePopulated) {
      throw new Error(
        'Expected subscriber fixtures to seed at least one subscriber',
      );
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('count', () => {
    it('should count subscribers', async () => {
      const countSpy = jest.spyOn(subscriberService, 'count');
      const result = await subscriberController.filterCount();

      expect(countSpy).toHaveBeenCalledWith({});
      expect(result).toEqual({ count: totalSubscribers });
    });
  });

  describe('findOne', () => {
    it('should find subscriber by id with populated relations', async () => {
      const populateSpy = jest.spyOn(subscriberService, 'findOneAndPopulate');
      const result = await subscriberController.findOne(referencePlain.id, [
        'labels',
        'assignedTo',
        'avatar',
      ]);

      expect(populateSpy).toHaveBeenCalledWith(referencePlain.id);
      expect(result).toEqualPayload(referencePopulated);
    });

    it('should find subscriber by id without populating relations', async () => {
      const findSpy = jest.spyOn(subscriberService, 'findOne');
      const result = await subscriberController.findOne(referencePlain.id, []);

      expect(findSpy).toHaveBeenCalledWith(referencePlain.id);
      expect(result).toEqualPayload(referencePlain);
    });
  });

  describe('findPage', () => {
    it('should find subscribers without populating relations when none requested', async () => {
      const findSpy = jest.spyOn(subscriberService, 'find');
      const result = await subscriberController.findPage([], defaultOrder);

      expect(findSpy).toHaveBeenCalledWith(defaultOrder);
      expect(result).toEqualPayload(plainSubscribers);
    });

    it('should find subscribers and populate requested relations', async () => {
      const populateSpy = jest.spyOn(subscriberService, 'findAndPopulate');
      const result = await subscriberController.findPage(
        ['labels', 'assignedTo', 'avatar'],
        defaultOrder,
      );

      expect(populateSpy).toHaveBeenCalledWith(defaultOrder);
      expect(result).toEqualPayload(populatedSubscribers);
    });
  });
});
