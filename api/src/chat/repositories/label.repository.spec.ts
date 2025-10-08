/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { labelFixtures } from '@/utils/test/fixtures/label';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Label, LabelFull } from '../schemas/label.schema';
import { Subscriber } from '../schemas/subscriber.schema';

import { LabelRepository } from './label.repository';
import { SubscriberRepository } from './subscriber.repository';

describe('LabelRepository', () => {
  let labelRepository: LabelRepository;
  let labelModel: Model<Label>;
  let subscriberRepository: SubscriberRepository;
  let users: Subscriber[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installSubscriberFixtures)],
      providers: [LabelRepository, SubscriberRepository],
    });
    [labelRepository, subscriberRepository, labelModel] = await getMocks([
      LabelRepository,
      SubscriberRepository,
      getModelToken(Label.name),
    ]);
    users = await subscriberRepository.findAll();
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findOneAndPopulate', () => {
    it('should find one label by id, and populate its users', async () => {
      jest.spyOn(labelModel, 'findById');
      const label = (await labelRepository.findOne({
        name: 'TEST_TITLE_2',
      })) as Label;
      const result = (await labelRepository.findOneAndPopulate(
        label.id,
      )) as LabelFull;

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

  describe('findAndPopulate', () => {
    it('should find labels, and foreach label populate its corresponding users', async () => {
      const pageQuery = getPageQuery<Label>();
      jest.spyOn(labelModel, 'find');
      const result = await labelRepository.findAndPopulate({}, pageQuery);
      const labelsWithUsers = labelFixtures.map((label) => ({
        ...label,
        users,
      }));

      expect(labelModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(labelsWithUsers.sort(sortRowsBy));
    });
  });
});
