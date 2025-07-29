/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
