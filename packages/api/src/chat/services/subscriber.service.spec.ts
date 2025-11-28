/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import mime from 'mime';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { AttachmentService } from '@/attachment/services/attachment.service';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentFile,
  AttachmentResourceRef,
} from '@/attachment/types';
import { LoggerService } from '@/logger/logger.service';
import { User } from '@/user/dto/user.dto';
import { UserRepository } from '@/user/repositories/user.repository';
import { installLabelGroupFixturesTypeOrm } from '@/utils/test/fixtures/label-group';
import { installSubscriberFixturesTypeOrm } from '@/utils/test/fixtures/subscriber';
import { sortRowsBy } from '@/utils/test/sort';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { IOOutgoingSubscribeMessage } from '@/websocket/pipes/io-message.pipe';
import { Room } from '@/websocket/types';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { Subscriber } from '../dto/subscriber.dto';
import { LabelGroupRepository } from '../repositories/label-group.repository';
import { LabelRepository } from '../repositories/label.repository';
import { SubscriberRepository } from '../repositories/subscriber.repository';

import { LabelService } from './label.service';
import { SubscriberService } from './subscriber.service';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('SubscriberService (TypeORM)', () => {
  let module: TestingModule;
  let subscriberService: SubscriberService;
  let subscriberRepository: SubscriberRepository;
  let labelRepository: LabelRepository;
  let labelGroupRepository: LabelGroupRepository;
  let userRepository: UserRepository;
  const STORED_ATTACHMENT_ID = '99999999-9999-4999-9999-999999999999';
  const EXISTING_ATTACHMENT_ID = '88888888-8888-4888-8888-888888888888';
  const gatewayMock = {
    joinNotificationSockets: jest.fn(),
  } as jest.Mocked<Pick<WebsocketGateway, 'joinNotificationSockets'>>;
  const loggerMock = {
    debug: jest.fn(),
    error: jest.fn(),
    log: jest.fn(),
    warn: jest.fn(),
  } as jest.Mocked<Pick<LoggerService, 'debug' | 'error' | 'log' | 'warn'>>;
  const attachmentServiceMock = {
    store: jest.fn(),
  } as jest.Mocked<Pick<AttachmentService, 'store'>>;
  const SESSION_ID = 'session-123';
  const SUCCESS_PAYLOAD: IOOutgoingSubscribeMessage = {
    success: true,
    subscribe: Room.SUBSCRIBER,
  };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        SubscriberService,
        LabelService,
        LabelRepository,
        LabelGroupRepository,
        SubscriberRepository,
        UserRepository,
        { provide: AttachmentService, useValue: attachmentServiceMock },
        { provide: WebsocketGateway, useValue: gatewayMock },
        { provide: LoggerService, useValue: loggerMock },
      ],
      typeorm: {
        fixtures: [
          installLabelGroupFixturesTypeOrm,
          installSubscriberFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;

    [
      subscriberService,
      subscriberRepository,
      labelRepository,
      labelGroupRepository,
      userRepository,
    ] = await testing.getMocks([
      SubscriberService,
      SubscriberRepository,
      LabelRepository,
      LabelGroupRepository,
      UserRepository,
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('subscribe', () => {
    it('should join Notification sockets subscriber room and return a success response', async () => {
      const req = {
        request: {
          session: { passport: { user: { id: SESSION_ID } } },
        },
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await subscriberService.subscribe(req as any, res as any);

      expect(gatewayMock.joinNotificationSockets).toHaveBeenCalledWith(
        req,
        Room.SUBSCRIBER,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(SUCCESS_PAYLOAD);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should find one subscriber and populate related data', async () => {
      const subscriber = await subscriberRepository.findOne({
        where: { first_name: 'Jhon' },
      });
      expect(subscriber).not.toBeNull();

      const spy = jest.spyOn(subscriberService, 'findOneAndPopulate');
      const result = await subscriberService.findOneAndPopulate(subscriber!.id);

      expect(spy).toHaveBeenCalledWith(subscriber!.id);
      expect(result).not.toBeNull();

      const [labels, users] = await Promise.all([
        labelRepository.findAll(),
        userRepository.findAll(),
      ]);
      const sortLabelsByName = <T extends { name: string }>(list: T[]) =>
        [...list].sort((a, b) => a.name.localeCompare(b.name));
      const expectedLabels = sortLabelsByName(
        labels.filter((label) => subscriber!.labels.includes(label.id)),
      );
      const normalizedResult = {
        ...result!,
        labels: sortLabelsByName(result!.labels ?? []),
      };

      expect(normalizedResult).toEqualPayload({
        ...subscriber,
        labels: expectedLabels,
        assignedTo: users.find(({ id }) => subscriber!.assignedTo === id),
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should find subscribers and populate related data', async () => {
      const spy = jest.spyOn(subscriberRepository, 'findAndPopulate');
      const result = await subscriberService.findAndPopulate();

      expect(spy).toHaveBeenCalled();
      expect(result).not.toHaveLength(0);

      const [subscribers, labels, users] = await Promise.all([
        subscriberRepository.findAll(),
        labelRepository.findAll(),
        userRepository.findAll(),
      ]);
      const sortLabelsByName = <T extends { name: string }>(list: T[]) =>
        [...list].sort((a, b) => a.name.localeCompare(b.name));
      const subscribersWithRelations = subscribers.map((subscriber) => ({
        ...subscriber,
        labels: sortLabelsByName(
          labels.filter((label) => subscriber.labels.includes(label.id)),
        ),
        assignedTo: users.find(({ id }) => subscriber.assignedTo === id),
      }));
      const normalizedResult = result.map((item) => ({
        ...item,
        labels: sortLabelsByName(item.labels ?? []),
      }));
      const expected = [...subscribersWithRelations].sort(sortRowsBy);
      const actual = [...normalizedResult].sort(sortRowsBy);

      expect(actual).toEqualPayload(expected);
    });
  });

  describe('findOneByForeignId', () => {
    it('should find one subscriber by foreign id', async () => {
      const subscriber = await subscriberRepository.findOne({
        where: { foreign_id: 'foreign-id-dimelo' },
      });
      expect(subscriber).not.toBeNull();

      const spy = jest.spyOn(subscriberRepository, 'findOneByForeignId');
      const result =
        await subscriberService.findOneByForeignId('foreign-id-dimelo');

      expect(spy).toHaveBeenCalledWith('foreign-id-dimelo');
      expect(result).toEqualPayload({
        ...subscriber,
        labels: subscriber!.labels,
      });
    });
  });

  describe('storeAvatar', () => {
    it('should persist the avatar and patch the subscriber', async () => {
      const subscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-messenger' },
      }))!;
      const avatarPayload: AttachmentFile = {
        file: Buffer.from('fake-png'),
        type: 'image/png',
        size: 8_192,
      };
      jest.spyOn(mime, 'extension').mockReturnValue('png');

      const fakeAttachment = Object.assign(new AttachmentOrmEntity(), {
        id: STORED_ATTACHMENT_ID,
      });
      attachmentServiceMock.store.mockResolvedValue(fakeAttachment as any);

      const attachmentRepository = module.get(
        getRepositoryToken(AttachmentOrmEntity),
      );
      await attachmentRepository.save(
        attachmentRepository.create({
          id: fakeAttachment.id,
          name: 'avatar-test-uuid.png',
          type: 'image/png',
          size: avatarPayload.size,
          location: `avatar-${fakeAttachment.id}`,
          resourceRef: AttachmentResourceRef.SubscriberAvatar,
          access: AttachmentAccess.Private,
          createdByRef: AttachmentCreatedByRef.Subscriber,
          createdBy: subscriber.id,
        }),
      );

      const result = await subscriberService.storeAvatar(
        subscriber.id,
        avatarPayload,
      );

      expect(attachmentServiceMock.store).toHaveBeenCalledTimes(1);
      expect(attachmentServiceMock.store).toHaveBeenCalledWith(
        avatarPayload.file,
        expect.objectContaining({
          name: 'avatar-test-uuid.png',
          type: 'image/png',
          size: 8_192,
          resourceRef: AttachmentResourceRef.SubscriberAvatar,
          access: AttachmentAccess.Private,
          createdByRef: AttachmentCreatedByRef.Subscriber,
          createdBy: subscriber.id,
        }),
      );

      expect(result.avatar).toBe(fakeAttachment.id);
    });

    it('should propagate an error from AttachmentService and leave the subscriber unchanged', async () => {
      const subscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-web-1' },
      }))!;
      const avatarPayload: AttachmentFile = {
        file: Buffer.from('fake-jpg'),
        type: 'image/jpeg',
        size: 5_048,
      };
      jest.spyOn(mime, 'extension').mockReturnValue('jpg');

      const failure = new Error('disk full');
      attachmentServiceMock.store.mockRejectedValue(failure);
      const updateOneSpy = jest
        .spyOn(subscriberService, 'updateOne')
        .mockResolvedValue(subscriber);

      await expect(
        subscriberService.storeAvatar(subscriber.id, avatarPayload),
      ).rejects.toThrow(failure);

      expect(updateOneSpy).not.toHaveBeenCalled();
    });

    it('should generate the filename with the proper extension', async () => {
      const subscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-web-2' },
      }))!;
      const avatarPayload: AttachmentFile = {
        file: Buffer.from('fake-png'),
        type: 'image/png',
        size: 1_024,
      };
      jest.spyOn(mime, 'extension').mockReturnValue('png');

      attachmentServiceMock.store.mockResolvedValue({
        id: EXISTING_ATTACHMENT_ID,
      } as any);

      const attachmentRepository = module.get(
        getRepositoryToken(AttachmentOrmEntity),
      );
      await attachmentRepository.save(
        attachmentRepository.create({
          id: EXISTING_ATTACHMENT_ID,
          name: 'avatar-test-uuid.png',
          type: 'image/png',
          size: avatarPayload.size,
          location: `avatar-${EXISTING_ATTACHMENT_ID}`,
          resourceRef: AttachmentResourceRef.SubscriberAvatar,
          access: AttachmentAccess.Private,
          createdByRef: AttachmentCreatedByRef.Subscriber,
          createdBy: subscriber.id,
        }),
      );

      await subscriberService.storeAvatar(subscriber.id, avatarPayload);

      const [, metadata] = attachmentServiceMock.store.mock.calls[0];
      expect(metadata.name).toBe('avatar-test-uuid.png');
    });
  });

  describe('assignLabels', () => {
    it('should merge and deduplicate labels', async () => {
      const profile = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-messenger' },
      }))!;
      const newLabels = (
        await labelRepository.createMany([
          { title: 'Is Interested', name: 'IS_INTERESTED' },
          { title: 'Follow Up Required', name: 'FOLLOW_UP_REQUIRED' },
        ])
      ).map(({ id }) => id);
      const expectedLabels = Array.from(
        new Set([...profile.labels, ...newLabels]),
      );
      const result = await subscriberService.assignLabels(profile, [
        ...newLabels,
        profile.labels[0],
      ]);

      expect([...result.labels].sort()).toEqual(expectedLabels.sort());
    });

    it('should handle mutual exclusion for grouped labels', async () => {
      const mutexGroup = await labelGroupRepository.create({
        name: 'MUTEX_TEST_GROUP',
      });
      const timestamp = Date.now();
      const [oldLabel, newLabel] = await labelRepository.createMany([
        {
          title: 'Mutex Old',
          name: `MUTEX_OLD_${timestamp}`,
          group: mutexGroup.id,
        },
        {
          title: 'Mutex New',
          name: `MUTEX_NEW_${timestamp}`,
          group: mutexGroup.id,
        },
      ]);
      const baseSubscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-web-1' },
      }))!;
      const alteredSubscriber = await subscriberService.assignLabels(
        baseSubscriber,
        [oldLabel.id],
      );
      const result = await subscriberService.assignLabels(alteredSubscriber, [
        newLabel.id,
      ]);
      const expected: Subscriber = {
        ...alteredSubscriber,
        labels: [
          ...alteredSubscriber.labels.filter((id) => id !== oldLabel.id),
          newLabel.id,
        ],
      };

      expect([...result.labels].sort()).toEqual([...expected.labels].sort());
      expect(result.labels).not.toContain(oldLabel.id);
    });

    it('should propagate errors from assignLabels', async () => {
      const base = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-web-2' },
      }))!;
      const failure = new Error('Any error');
      const targetLabel = base.labels[0];
      expect(targetLabel).toBeDefined();

      jest.spyOn(subscriberService, 'assignLabels').mockRejectedValue(failure);

      await expect(
        subscriberService.applyUpdates(base as any, [targetLabel], null),
      ).rejects.toThrow(failure);
    });
  });

  describe('handOver', () => {
    it('should set assignedTo when provided without labels', async () => {
      const profile = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-web-1' },
      }))!;
      const assignee = (await userRepository.findOne({
        where: { username: 'admin' },
      })) as User;
      const expected = { ...profile, assignedTo: assignee.id } as Subscriber;
      const updateSpy = jest
        .spyOn(subscriberService, 'updateOne')
        .mockResolvedValue(expected);
      const result = await subscriberService.handOver(profile, assignee.id);

      expect(updateSpy).toHaveBeenCalledWith(profile.id, {
        assignedTo: assignee.id,
      });
      expect(result).toEqualPayload(expected);
    });
  });
});
