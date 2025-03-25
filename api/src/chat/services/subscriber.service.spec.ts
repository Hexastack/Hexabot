/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { InvitationRepository } from '@/user/repositories/invitation.repository';
import { RoleRepository } from '@/user/repositories/role.repository';
import { UserRepository } from '@/user/repositories/user.repository';
import { InvitationModel } from '@/user/schemas/invitation.schema';
import { PermissionModel } from '@/user/schemas/permission.schema';
import { RoleModel } from '@/user/schemas/role.schema';
import { User, UserModel } from '@/user/schemas/user.schema';
import { RoleService } from '@/user/services/role.service';
import { UserService } from '@/user/services/user.service';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { LabelRepository } from '../repositories/label.repository';
import { SubscriberRepository } from '../repositories/subscriber.repository';
import { Label, LabelModel } from '../schemas/label.schema';
import { Subscriber, SubscriberModel } from '../schemas/subscriber.schema';

import { LabelService } from './label.service';
import { SubscriberService } from './subscriber.service';

describe('SubscriberService', () => {
  let subscriberRepository: SubscriberRepository;
  let labelRepository: LabelRepository;
  let userRepository: UserRepository;
  let subscriberService: SubscriberService;
  let allSubscribers: Subscriber[];
  let allLabels: Label[];
  let allUsers: User[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(installSubscriberFixtures),
        MongooseModule.forFeature([
          SubscriberModel,
          LabelModel,
          UserModel,
          RoleModel,
          InvitationModel,
          PermissionModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        SubscriberService,
        SubscriberRepository,
        LabelService,
        LabelRepository,
        UserService,
        UserRepository,
        RoleService,
        RoleRepository,
        InvitationRepository,
        AttachmentService,
        AttachmentRepository,
      ],
    });
    [labelRepository, userRepository, subscriberService, subscriberRepository] =
      await getMocks([
        LabelRepository,
        UserRepository,
        SubscriberService,
        SubscriberRepository,
      ]);
    allSubscribers = await subscriberRepository.findAll();
    allLabels = await labelRepository.findAll();
    allUsers = await userRepository.findAll();
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

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
      jest.spyOn(subscriberRepository, 'findPageAndPopulate');
      const result = await subscriberService.findPageAndPopulate({}, pageQuery);
      const subscribersWithLabels = allSubscribers.map((subscriber) => ({
        ...subscriber,
        labels: allLabels.filter((label) =>
          subscriber.labels.includes(label.id),
        ),
        assignedTo: allUsers.find(({ id }) => subscriber.assignedTo === id),
      }));

      expect(subscriberRepository.findPageAndPopulate).toHaveBeenCalled();
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
});
