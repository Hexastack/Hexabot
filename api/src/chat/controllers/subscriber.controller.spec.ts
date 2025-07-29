/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { User } from '@/user/schemas/user.schema';
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
import { Subscriber } from '../schemas/subscriber.schema';
import { SubscriberService } from '../services/subscriber.service';

import { UserService } from './../../user/services/user.service';
import { LabelService } from './../services/label.service';
import { SubscriberController } from './subscriber.controller';

describe('SubscriberController', () => {
  let subscriberController: SubscriberController;
  let subscriberService: SubscriberService;
  let labelService: LabelService;
  let userService: UserService;
  let subscriber: Subscriber;
  let allLabels: Label[];
  let allSubscribers: Subscriber[];
  let allUsers: User[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [SubscriberController],
      imports: [rootMongooseTestModule(installSubscriberFixtures)],
      providers: [LabelService, UserService],
    });
    [subscriberService, labelService, userService, subscriberController] =
      await getMocks([
        SubscriberService,
        LabelService,
        UserService,
        SubscriberController,
      ]);
    subscriber = (await subscriberService.findOne({
      first_name: 'Jhon',
    }))!;
    allLabels = await labelService.findAll();
    allSubscribers = await subscriberService.findAll();
    allUsers = await userService.findAll();
  });

  afterEach(jest.clearAllMocks);

  afterAll(closeInMongodConnection);

  describe('count', () => {
    it('should count subscribers', async () => {
      jest.spyOn(subscriberService, 'count');
      const result = await subscriberController.filterCount();

      expect(subscriberService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: subscriberFixtures.length });
    });
  });

  describe('findOne', () => {
    it('should find one subscriber by id', async () => {
      jest.spyOn(subscriberService, 'findOne');
      const result = await subscriberService.findOne(subscriber.id);
      const labelIDs = allLabels
        .filter((label) => subscriber.labels.includes(label.id))
        .map(({ id }) => id);

      expect(subscriberService.findOne).toHaveBeenCalledWith(subscriber.id);
      expect(result).toEqualPayload({
        ...subscriberFixtures.find(
          ({ first_name }) => first_name === subscriber.first_name,
        ),
        labels: labelIDs,
        assignedTo: allUsers.find(({ id }) => subscriber.assignedTo === id)?.id,
        context: undefined,
      });
    });

    it('should find one subscriber by id, and populate its corresponding labels', async () => {
      jest.spyOn(subscriberService, 'findOneAndPopulate');
      const result = await subscriberController.findOne(subscriber.id, [
        'labels',
      ]);

      expect(subscriberService.findOneAndPopulate).toHaveBeenCalledWith(
        subscriber.id,
      );
      expect(result).toEqualPayload({
        ...subscriberFixtures.find(
          ({ first_name }) => first_name === subscriber.first_name,
        ),
        labels: allLabels.filter((label) =>
          subscriber.labels.includes(label.id),
        ),
        assignedTo: allUsers.find(({ id }) => subscriber.assignedTo === id),
        context: undefined,
      });
    });
  });

  describe('findPage', () => {
    const pageQuery = getPageQuery<Subscriber>();
    it('should find subscribers', async () => {
      jest.spyOn(subscriberService, 'find');
      const result = await subscriberController.findPage(pageQuery, [], {});
      const subscribersWithIds = allSubscribers.map(({ labels, ...rest }) => ({
        ...rest,
        labels: allLabels
          .filter((label) => labels.includes(label.id))
          .map(({ id }) => id),
      }));

      expect(subscriberService.find).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(subscribersWithIds.sort(sortRowsBy));
    });

    it('should find subscribers, and foreach subscriber populate the corresponding labels', async () => {
      jest.spyOn(subscriberService, 'findAndPopulate');
      const result = await subscriberController.findPage(
        pageQuery,
        ['labels'],
        {},
      );
      const subscribersWithLabels = allSubscribers.map(
        ({ labels, ...rest }) => ({
          ...rest,
          labels: allLabels.filter((label) => labels.includes(label.id)),
          assignedTo: allUsers.find(({ id }) => subscriber.assignedTo === id),
        }),
      );

      expect(subscriberService.findAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
      );
      expect(result).toEqualPayload(subscribersWithLabels.sort(sortRowsBy));
    });
  });
});
