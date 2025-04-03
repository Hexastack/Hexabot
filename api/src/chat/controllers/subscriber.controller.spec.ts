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
import { SocketEventDispatcherService } from '@/websocket/services/socket-event-dispatcher.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { LabelRepository } from '../repositories/label.repository';
import { SubscriberRepository } from '../repositories/subscriber.repository';
import { Label, LabelModel } from '../schemas/label.schema';
import { Subscriber, SubscriberModel } from '../schemas/subscriber.schema';
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
      controllers: [SubscriberController],
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
        SubscriberRepository,
        SubscriberService,
        LabelService,
        LabelRepository,
        UserService,
        WebsocketGateway,
        SocketEventDispatcherService,
        UserRepository,
        RoleService,
        RoleRepository,
        InvitationRepository,
        AttachmentService,
        AttachmentRepository,
      ],
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
