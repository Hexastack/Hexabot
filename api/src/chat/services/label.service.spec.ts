/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  installLabelFixtures,
  labelFixtures,
} from '@/utils/test/fixtures/label';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { LabelRepository } from '../repositories/label.repository';
import { Label, LabelFull } from '../schemas/label.schema';
import { Subscriber } from '../schemas/subscriber.schema';

import { SubscriberRepository } from './../repositories/subscriber.repository';
import { LabelService } from './label.service';

describe('LabelService', () => {
  let labelRepository: LabelRepository;
  let labelService: LabelService;
  let subscriberRepository: SubscriberRepository;
  let allSubscribers: Subscriber[];
  let allLabels: LabelFull[];
  let labelsWithUsers: LabelFull[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installLabelFixtures)],
      providers: [LabelService, SubscriberRepository],
    });
    [labelService, labelRepository, subscriberRepository] = await getMocks([
      LabelService,
      LabelRepository,
      SubscriberRepository,
    ]);
    allSubscribers = await subscriberRepository.findAll();
    allLabels = await labelRepository.findAllAndPopulate();
    labelsWithUsers = allLabels.map((label) => ({
      ...label,
      users: allSubscribers,
    }));
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findAllAndPopulate', () => {
    it('should find all labels, and foreach label populate its corresponding users', async () => {
      jest.spyOn(labelRepository, 'findAllAndPopulate');
      const result = await labelService.findAllAndPopulate();

      expect(labelRepository.findAllAndPopulate).toHaveBeenCalled();
      expect(result).toEqualPayload(labelsWithUsers);
    });
  });

  describe('findAndPopulate', () => {
    const pageQuery = getPageQuery<Label>();
    it('should find labels, and foreach label populate its corresponding users', async () => {
      jest.spyOn(labelRepository, 'findAndPopulate');
      const result = await labelService.findAndPopulate({}, pageQuery);

      expect(labelRepository.findAndPopulate).toHaveBeenCalled();
      expect(result).toEqualPayload(labelsWithUsers.sort(sortRowsBy));
    });
  });

  describe('findOneAndPopulate', () => {
    it('should find one label by id, and populate its corresponding users', async () => {
      jest.spyOn(labelRepository, 'findOneAndPopulate');
      const label = (await labelRepository.findOne({
        name: 'TEST_TITLE_1',
      })) as Label;
      const result = await labelService.findOneAndPopulate(label.id);

      expect(result).toEqualPayload({
        ...labelFixtures.find(({ name }) => name === label.name),
        users: allSubscribers,
      });
    });
  });
});
