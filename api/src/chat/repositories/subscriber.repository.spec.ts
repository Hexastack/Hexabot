/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { Attachment } from '@/attachment/schemas/attachment.schema';
import { UserRepository } from '@/user/repositories/user.repository';
import { User } from '@/user/schemas/user.schema';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
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

import { Label } from '../schemas/label.schema';
import { Subscriber, SubscriberFull } from '../schemas/subscriber.schema';

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
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installSubscriberFixtures)],
      providers: [
        SubscriberRepository,
        LabelRepository,
        UserRepository,
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
        context: undefined,
      };

      expect(subscriberModel.findById).toHaveBeenCalledWith(
        subscriber.id,
        undefined,
      );
      expect(result).toEqualPayload(subscriberWithLabels);
    });
  });

  describe('findAndPopulate', () => {
    const pageQuery = getPageQuery<Subscriber>();
    it('should find subscribers, and foreach subscriber populate the corresponding labels', async () => {
      jest.spyOn(subscriberModel, 'find');
      const result = await subscriberRepository.findAndPopulate({}, pageQuery);

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

  describe('updateLabels', () => {
    it('should add labels without duplicates when labelsToPull is empty', async () => {
      const subscriber = await subscriberRepository.findOne({
        first_name: 'Maynard',
      });

      expect(subscriber).toBeTruthy();

      // one existing label (if any) and one new label not already present
      const existingLabelId = (subscriber!.labels || [])[0] || allLabels[0].id;
      const newLabel = await labelRepository.create({
        title: 'New Label',
        name: 'NEW_LABEL',
      });

      const labelsToPush = [existingLabelId, newLabel!.id, newLabel!.id]; // duplicates on purpose

      // Act
      const result = await subscriberRepository.updateLabels(
        subscriber!.id,
        labelsToPush,
        [],
      );

      // Assert
      const updated = await subscriberRepository.findOne(subscriber!.id);
      expect(updated).toBeTruthy();

      // Existing labels remain
      expect(updated).toEqual(result);
      expect(updated!.labels).toEqual(
        expect.arrayContaining(subscriber!.labels),
      );
      // New label present only once
      const occurrences = updated!.labels.filter(
        (x) => x === newLabel!.id,
      ).length;
      expect(occurrences).toBe(1);
    });

    it('should pull provided labels then push the new ones when labelsToPull is not empty', async () => {
      // Use another subscriber to avoid interference with the previous test
      const subscriber = await subscriberRepository.findOne({
        first_name: 'Queen',
      });

      const labelToRemove = subscriber!.labels[0];
      const newLabel = await labelRepository.create({
        title: 'Royal',
        name: 'ROYAL',
      });

      const prevLabels = [...subscriber!.labels];

      await subscriberRepository.updateLabels(
        subscriber!.id,
        [newLabel!.id, newLabel!.id],
        [labelToRemove],
      );

      const updated = await subscriberRepository.findOne(subscriber!.id);
      expect(updated).toBeTruthy();

      // We add and remove a new one : count should remain the same
      expect(updated!.labels.length).toEqual(subscriber?.labels.length);
      // Removed label is gone
      expect(updated!.labels).not.toContain(labelToRemove);
      // New label present
      expect(updated!.labels).toContain(newLabel!.id);
      // Other labels remain unchanged
      const remainingPrev = prevLabels.filter((l) => l !== labelToRemove);
      expect(updated!.labels).toEqual(expect.arrayContaining(remainingPrev));
    });

    it('should throw if subscriber does not exist during pull stage', async () => {
      await expect(
        subscriberRepository.updateLabels(
          NOT_FOUND_ID,
          ['1'.repeat(24)],
          ['2'.repeat(24)],
        ),
      ).rejects.toThrow(`Unable to pull subscriber labels : ${NOT_FOUND_ID}`);
    });

    it('should throw if subscriber does not exist during add stage', async () => {
      await expect(
        subscriberRepository.updateLabels(NOT_FOUND_ID, ['1'.repeat(24)], []),
      ).rejects.toThrow(`Unable to assign subscriber labels : ${NOT_FOUND_ID}`);
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
