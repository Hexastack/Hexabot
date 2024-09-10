/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import {
  Attachment,
  AttachmentModel,
} from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { LoggerService } from '@/logger/logger.service';
import { UserRepository } from '@/user/repositories/user.repository';
import { UserModel, User } from '@/user/schemas/user.schema';
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

import { LabelRepository } from './label.repository';
import { SubscriberRepository } from './subscriber.repository';
import { LabelModel, Label } from '../schemas/label.schema';
import {
  SubscriberModel,
  Subscriber,
  SubscriberFull,
} from '../schemas/subscriber.schema';

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
    const module = await Test.createTestingModule({
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
        EventEmitter2,
        LoggerService,
        AttachmentService,
        AttachmentRepository,
      ],
    }).compile();
    subscriberRepository =
      module.get<SubscriberRepository>(SubscriberRepository);
    labelRepository = module.get<LabelRepository>(LabelRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    attachmentRepository =
      module.get<AttachmentRepository>(AttachmentRepository);
    subscriberModel = module.get<Model<Subscriber>>(
      getModelToken('Subscriber'),
    );
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
      const subscriber = await subscriberRepository.findOne({
        first_name: 'Jhon',
      });
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

      expect(subscriberModel.findById).toHaveBeenCalledWith(subscriber.id);
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

      expect(subscriberModel.find).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(
        subscribersWithPopulatedFields.sort(sortRowsBy),
      );
    });
  });

  describe('findAllAndPopulate', () => {
    it('should return all subscribers, and foreach subscriber populate the corresponding labels', async () => {
      jest.spyOn(subscriberModel, 'find');
      const result = await subscriberRepository.findAllAndPopulate();

      expect(subscriberModel.find).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(
        subscribersWithPopulatedFields.sort(sortRowsBy),
      );
    });
  });
});
