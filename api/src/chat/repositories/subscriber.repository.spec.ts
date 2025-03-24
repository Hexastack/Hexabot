/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import {
  Attachment,
  AttachmentModel,
} from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { UserRepository } from '@/user/repositories/user.repository';
import { User, UserModel } from '@/user/schemas/user.schema';
import {
  installSubscriberFixtures,
  subscriberFixtures,
} from '@/utils/test/fixtures/subscriber';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Label, LabelModel } from '../schemas/label.schema';
import {
  Subscriber,
  SubscriberFull,
  SubscriberModel,
} from '../schemas/subscriber.schema';

import { LabelRepository } from './label.repository';
import { SubscriberRepository } from './subscriber.repository';

describe('SubscriberRepository', () => {
  let subscriberRepository: SubscriberRepository;
  let subscriberModel: Model<Subscriber>;
  let labelRepository: LabelRepository;
  let userRepository: UserRepository;
  let attachmentRepository: AttachmentRepository;
  let allLabels: Label[];
  let allUsers: User[];
  let allSubscribers: Subscriber[];
  let allAttachments: Attachment[];
  let subscribersWithPopulatedFields: SubscriberFull[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installSubscriberFixtures),
        MongooseModule.forFeature([
          SubscriberModel,
          LabelModel,
          UserModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        SubscriberRepository,
        LabelRepository,
        UserRepository,
        AttachmentService,
        AttachmentRepository,
      ],
    });
    [
      subscriberRepository,
      labelRepository,
      userRepository,
      attachmentRepository,
      subscriberModel,
    ] = await getMocks([
      SubscriberRepository,
      LabelRepository,
      UserRepository,
      AttachmentRepository,
      getModelToken(Subscriber.name),
    ]);

    allLabels = await labelRepository.findAll();
    allSubscribers = await subscriberRepository.findAll();
    allUsers = await userRepository.findAll();
    allAttachments = await attachmentRepository.findAll();
    subscribersWithPopulatedFields = allSubscribers.map((subscriber) => ({
      ...subscriber,
      labels: allLabels.filter((label) => subscriber.labels.includes(label.id)),
      assignedTo:
        allUsers.find(({ id }) => subscriber.assignedTo === id) || null,
      avatar: allAttachments.find(({ id }) => subscriber.avatar === id) || null,
    }));
  });

  afterEach(jest.clearAllMocks);

  afterAll(closeInMongodConnection);

  describe('findOneAndPopulate', () => {
    it('should find one subscriber by id,and populate its labels', async () => {
      jest.spyOn(subscriberModel, 'findById');
      const subscriber = (await subscriberRepository.findOne({
        first_name: 'Jhon',
      }))!;
      const allLabels = await labelRepository.findAll();
      const result = await subscriberRepository.findOneAndPopulate(
        subscriber.id,
      );
      const subscriberWithLabels = {
        ...subscriberFixtures.find(
          ({ first_name }) => first_name === subscriber.first_name,
        ),
        labels: allLabels.filter((label) =>
          subscriber.labels.includes(label.id),
        ),
        assignedTo: allUsers.find(({ id }) => subscriber.assignedTo === id),
      };

      expect(subscriberModel.findById).toHaveBeenCalledWith(
        subscriber.id,
        undefined,
      );
      expect(result).toEqualPayload(subscriberWithLabels);
    });
  });

  describe('findPageAndPopulate', () => {
    const pageQuery = getPageQuery<Subscriber>();
    it('should find subscribers, and foreach subscriber populate the corresponding labels', async () => {
      jest.spyOn(subscriberModel, 'find');
      const result = await subscriberRepository.findPageAndPopulate(
        {},
        pageQuery,
      );

      expect(subscriberModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(
        subscribersWithPopulatedFields.sort(sortRowsBy),
      );
    });
  });

  describe('findAllAndPopulate', () => {
    it('should return all subscribers, and foreach subscriber populate the corresponding labels', async () => {
      jest.spyOn(subscriberModel, 'find');
      const result = await subscriberRepository.findAllAndPopulate();

      expect(subscriberModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(
        subscribersWithPopulatedFields.sort(sortRowsBy),
      );
    });
  });

  describe('updateOne', () => {
    it('should execute preUpdate hook and emit events on assignedTo change', async () => {
      // Arrange: Set up a mock subscriber
      const oldSubscriber = {
        ...subscriberFixtures[0], // Mocked existing subscriber
        assignedTo: null,
      } as Subscriber;

      const updates = { assignedTo: '9'.repeat(24) }; // Change assigned user;

      jest
        .spyOn(subscriberRepository, 'findOne')
        .mockResolvedValue(oldSubscriber);
      jest.spyOn(subscriberRepository.eventEmitter, 'emit');

      await subscriberRepository.updateOne(oldSubscriber.id, updates);

      expect(subscriberRepository.eventEmitter.emit).toHaveBeenCalledWith(
        'hook:subscriber:assign',
        expect.anything(),
        expect.anything(),
      );
      expect(subscriberRepository.eventEmitter.emit).toHaveBeenCalledWith(
        'hook:analytics:passation',
        expect.anything(),
        true, // Because assignedTo has changed
      );
    });

    it('should not emit events if assignedTo remains unchanged', async () => {
      const oldSubscriber = {
        ...subscriberFixtures[0],
        assignedTo: '8'.repeat(24),
      } as Subscriber;

      const updates = { assignedTo: '8'.repeat(24) }; // Same user;

      jest
        .spyOn(subscriberRepository, 'findOne')
        .mockResolvedValue(oldSubscriber);
      jest.spyOn(subscriberRepository.eventEmitter, 'emit');

      await subscriberRepository.updateOne(oldSubscriber.id, updates);

      expect(subscriberRepository.eventEmitter.emit).not.toHaveBeenCalledWith(
        'hook:subscriber:assign',
        expect.anything(),
        expect.anything(),
      );
      expect(subscriberRepository.eventEmitter.emit).not.toHaveBeenCalledWith(
        'hook:analytics:passation',
        expect.anything(),
        expect.anything(),
      );
    });

    it('should throw an error if the subscriber does not exist', async () => {
      jest.spyOn(subscriberRepository, 'findOne').mockResolvedValue(null);

      await expect(
        subscriberRepository.updateOne('0'.repeat(24), {
          $set: { assignedTo: 'user-456' },
        }),
      ).rejects.toThrow();
    });
  });
});
