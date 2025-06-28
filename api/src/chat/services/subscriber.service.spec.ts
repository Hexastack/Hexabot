/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mime from 'mime';

import { Attachment } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import {
  AttachmentAccess,
  AttachmentCreatedByRef,
  AttachmentFile,
  AttachmentResourceRef,
} from '@/attachment/types';
import { UserRepository } from '@/user/repositories/user.repository';
import { User } from '@/user/schemas/user.schema';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { IOOutgoingSubscribeMessage } from '@/websocket/pipes/io-message.pipe';
import { Room } from '@/websocket/types';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { LabelRepository } from '../repositories/label.repository';
import { SubscriberRepository } from '../repositories/subscriber.repository';
import { Label } from '../schemas/label.schema';
import { Subscriber } from '../schemas/subscriber.schema';

import { SubscriberService } from './subscriber.service';

jest.mock('uuid', () => ({ v4: jest.fn(() => 'test-uuid') }));

describe('SubscriberService', () => {
  let subscriberRepository: SubscriberRepository;
  let labelRepository: LabelRepository;
  let userRepository: UserRepository;
  let subscriberService: SubscriberService;
  let attachmentService: AttachmentService;
  let allSubscribers: Subscriber[];
  let allLabels: Label[];
  let allUsers: User[];
  let mockGateway: Partial<WebsocketGateway>;
  let mockSubscriberService: SubscriberService;
  const SESSION_ID = 'session-123';
  const SUCCESS_PAYLOAD: IOOutgoingSubscribeMessage = {
    success: true,
    subscribe: Room.SUBSCRIBER,
  };

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installSubscriberFixtures)],
      providers: [SubscriberService, LabelRepository, UserRepository],
    });
    [
      labelRepository,
      userRepository,
      subscriberService,
      subscriberRepository,
      attachmentService,
    ] = await getMocks([
      LabelRepository,
      UserRepository,
      SubscriberService,
      SubscriberRepository,
      AttachmentService,
    ]);
    allSubscribers = await subscriberRepository.findAll();
    allLabels = await labelRepository.findAll();
    allUsers = await userRepository.findAll();
    mockGateway = {
      joinNotificationSockets: jest.fn(),
    };
    mockSubscriberService = new SubscriberService(
      {} as any,
      {} as any,
      mockGateway as any,
    );
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('subscribe', () => {
    it('should join Notification sockets subscriber room and return a success response', async () => {
      const req = { sessionID: SESSION_ID };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await mockSubscriberService.subscribe(req as any, res as any);

      expect(mockGateway.joinNotificationSockets).toHaveBeenCalledWith(
        SESSION_ID,
        Room.SUBSCRIBER,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(SUCCESS_PAYLOAD);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should find subscribers, and foreach subscriber populate its corresponding labels', async () => {
      jest.spyOn(subscriberService, 'findOneAndPopulate');
      const subscriber = (await subscriberRepository.findOne({
        first_name: 'Jhon',
      }))!;
      const result = await subscriberService.findOneAndPopulate(subscriber.id);

      expect(subscriberService.findOneAndPopulate).toHaveBeenCalledWith(
        subscriber.id,
      );
      expect(result).toEqualPayload({
        ...subscriber,
        labels: allLabels.filter((label) =>
          subscriber.labels.includes(label.id),
        ),
        assignedTo: allUsers.find(({ id }) => subscriber.assignedTo === id),
      });
    });
  });

  describe('findPageAndPopulate', () => {
    const pageQuery = getPageQuery<Subscriber>();
    it('should find subscribers, and foreach subscriber populate its corresponding labels', async () => {
      jest.spyOn(subscriberRepository, 'findAndPopulate');
      const result = await subscriberService.findAndPopulate({}, pageQuery);
      const subscribersWithLabels = allSubscribers.map((subscriber) => ({
        ...subscriber,
        labels: allLabels.filter((label) =>
          subscriber.labels.includes(label.id),
        ),
        assignedTo: allUsers.find(({ id }) => subscriber.assignedTo === id),
      }));

      expect(subscriberRepository.findAndPopulate).toHaveBeenCalled();
      expect(result).toEqualPayload(subscribersWithLabels.sort(sortRowsBy));
    });
  });

  describe('findOneByForeignId', () => {
    it('should find one subscriber by foreign id', async () => {
      jest.spyOn(subscriberRepository, 'findOneByForeignId');
      const result =
        await subscriberService.findOneByForeignId('foreign-id-dimelo');
      const subscriber = allSubscribers.find(
        ({ foreign_id }) => foreign_id === 'foreign-id-dimelo',
      )!;

      expect(subscriberRepository.findOneByForeignId).toHaveBeenCalled();
      expect(result).toEqualPayload({
        ...subscriber,
        labels: allLabels
          .filter((label) => subscriber.labels.includes(label.id))
          .map((label) => label.id),
      });
    });
  });

  describe('storeAvatar', () => {
    it('should persist the avatar and patch the subscriber', async () => {
      const subscriber = { ...allSubscribers[0], avatar: null };
      const avatarPayload: AttachmentFile = {
        file: Buffer.from('fake-png'),
        type: 'image/png',
        size: 8_192,
      };
      jest.spyOn(mime, 'extension').mockReturnValue('png');

      const fakeAttachment = { id: '9'.repeat(24) } as Attachment;
      jest.spyOn(attachmentService, 'store').mockResolvedValue(fakeAttachment);

      const result = await subscriberService.storeAvatar(
        subscriber.id,
        avatarPayload,
      );

      expect(attachmentService.store).toHaveBeenCalledTimes(1);
      expect(attachmentService.store).toHaveBeenCalledWith(
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
      const subscriber = allSubscribers[0];
      const avatarPayload: AttachmentFile = {
        file: Buffer.from('fake-jpg'),
        type: 'image/jpeg',
        size: 5_048,
      };
      jest.spyOn(mime, 'extension').mockReturnValue('jpg');

      const failure = new Error('disk full');
      jest.spyOn(attachmentService, 'store').mockRejectedValue(failure);
      const updateOneSpy = jest
        .spyOn(subscriberService, 'updateOne')
        .mockResolvedValue(allSubscribers[0]);

      await expect(
        subscriberService.storeAvatar(subscriber.id, avatarPayload),
      ).rejects.toThrow(failure);

      expect(updateOneSpy).not.toHaveBeenCalled();
    });

    it('should generate the filename with the proper extension', async () => {
      const subscriber = { ...allSubscribers[0], avatar: null };
      const avatarPayload: AttachmentFile = {
        file: Buffer.from('fake-png'),
        type: 'image/png',
        size: 1_024,
      };
      jest.spyOn(mime, 'extension').mockReturnValue('png');

      jest
        .spyOn(attachmentService, 'store')
        .mockResolvedValue({ id: '9'.repeat(24) } as any);
      jest
        .spyOn(subscriberService, 'updateOne')
        .mockResolvedValue(allSubscribers[0]);

      await subscriberService.storeAvatar(subscriber.id, avatarPayload);

      const { name } = (attachmentService.store as jest.Mock).mock.calls[0][1]; // second arg in the first call
      expect(name).toBe('avatar-test-uuid.png');
    });
  });
});
