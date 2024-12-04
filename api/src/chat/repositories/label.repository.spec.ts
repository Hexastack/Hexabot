/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Model } from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import { labelFixtures } from '@/utils/test/fixtures/label';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { Label, LabelModel } from '../schemas/label.schema';
import { Subscriber, SubscriberModel } from '../schemas/subscriber.schema';

import { LabelRepository } from './label.repository';
import { SubscriberRepository } from './subscriber.repository';

describe('LabelRepository', () => {
  let labelRepository: LabelRepository;
  let labelModel: Model<Label>;
  let subscriberRepository: SubscriberRepository;
  let users: Subscriber[];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installSubscriberFixtures),
        MongooseModule.forFeature([LabelModel, SubscriberModel]),
      ],
      providers: [
        LabelRepository,
        SubscriberRepository,
        EventEmitter2,
        LoggerService,
      ],
    }).compile();
    labelRepository = module.get<LabelRepository>(LabelRepository);
    subscriberRepository =
      module.get<SubscriberRepository>(SubscriberRepository);
    labelModel = module.get<Model<Label>>(getModelToken('Label'));
    users = await subscriberRepository.findAll();
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findOneAndPopulate', () => {
    it('should find one label by id, and populate its users', async () => {
      jest.spyOn(labelModel, 'findById');
      const label = await labelRepository.findOne({ name: 'TEST_TITLE_2' });
      const result = await labelRepository.findOneAndPopulate(label.id);

      expect(labelModel.findById).toHaveBeenCalledWith(label.id, undefined);
      expect(result).toEqualPayload({
        ...labelFixtures.find(({ name }) => name === label.name),
        users,
      });
    });
  });

  describe('findAllAndPopulate', () => {
    it('should find all labels, and foreach label populate its corresponding users', async () => {
      jest.spyOn(labelModel, 'find');
      const result = await labelRepository.findAllAndPopulate();
      const labelsWithUsers = labelFixtures.map((label) => ({
        ...label,
        users,
      }));

      expect(labelModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(labelsWithUsers);
    });
  });

  describe('findPageAndPopulate', () => {
    it('should find labels, and foreach label populate its corresponding users', async () => {
      const pageQuery = getPageQuery<Label>();
      jest.spyOn(labelModel, 'find');
      const result = await labelRepository.findPageAndPopulate({}, pageQuery);
      const labelsWithUsers = labelFixtures.map((label) => ({
        ...label,
        users,
      }));

      expect(labelModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(labelsWithUsers.sort(sortRowsBy));
    });
  });
});
