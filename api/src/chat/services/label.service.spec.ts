/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { LoggerService } from '@/logger/logger.service';
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

import { LabelRepository } from '../repositories/label.repository';
import { Label, LabelFull, LabelModel } from '../schemas/label.schema';
import { Subscriber, SubscriberModel } from '../schemas/subscriber.schema';

import { SubscriberRepository } from './../repositories/subscriber.repository';
import { LabelService } from './label.service';
import { SubscriberService } from './subscriber.service';

describe('LabelService', () => {
  let labelRepository: LabelRepository;
  let labelService: LabelService;
  let subscriberRepository: SubscriberRepository;
  let allSubscribers: Subscriber[];
  let allLabels: Label[];
  let labelsWithUsers: LabelFull[];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installLabelFixtures),
        MongooseModule.forFeature([
          LabelModel,
          SubscriberModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        LoggerService,
        LabelService,
        LabelRepository,
        SubscriberService,
        AttachmentService,
        AttachmentRepository,
        SubscriberRepository,
        EventEmitter2,
      ],
    }).compile();
    labelService = module.get<LabelService>(LabelService);
    labelRepository = module.get<LabelRepository>(LabelRepository);
    subscriberRepository =
      module.get<SubscriberRepository>(SubscriberRepository);
    allSubscribers = await subscriberRepository.findAll();
    allLabels = await labelRepository.findAll();
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

  describe('findPageAndPopulate', () => {
    const pageQuery = getPageQuery<Label>();
    it('should find labels, and foreach label populate its corresponding users', async () => {
      jest.spyOn(labelRepository, 'findPageAndPopulate');
      const result = await labelService.findPageAndPopulate({}, pageQuery);

      expect(labelRepository.findPageAndPopulate).toHaveBeenCalled();
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
