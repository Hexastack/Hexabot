/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { MenuRepository } from '@/cms/repositories/menu.repository';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { SettingService } from '@/setting/services/setting.service';
import { RoleRepository } from '@/user/repositories/role.repository';
import { UserRepository } from '@/user/repositories/user.repository';
import { PermissionModel } from '@/user/schemas/permission.schema';
import { RoleModel } from '@/user/schemas/role.schema';
import { User, UserModel } from '@/user/schemas/user.schema';
import { RoleService } from '@/user/services/role.service';
import { UserService } from '@/user/services/user.service';
import {
  installMessageFixtures,
  messageFixtures,
} from '@/utils/test/fixtures/message';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { MessageController } from './message.controller';
import { MessageRepository } from '../repositories/message.repository';
import { SubscriberRepository } from '../repositories/subscriber.repository';
import { Message, MessageModel } from '../schemas/message.schema';
import { Subscriber, SubscriberModel } from '../schemas/subscriber.schema';
import { MessageService } from '../services/message.service';
import { SubscriberService } from '../services/subscriber.service';

describe('MessageController', () => {
  let messageController: MessageController;
  let messageService: MessageService;
  let subscriberService: SubscriberService;
  let userService: UserService;
  let sender: Subscriber;
  let recipient: Subscriber;
  let user: User;
  let message: Message;
  let allMessages: Message[];
  let allUsers: User[];
  let allSubscribers: Subscriber[];

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [MessageController],
      imports: [
        rootMongooseTestModule(installMessageFixtures),
        MongooseModule.forFeature([
          SubscriberModel,
          MessageModel,
          UserModel,
          RoleModel,
          PermissionModel,
          AttachmentModel,
          MenuModel,
        ]),
      ],
      providers: [
        MessageController,
        MessageRepository,
        MessageService,
        SubscriberService,
        UserService,
        UserRepository,
        RoleService,
        RoleRepository,
        SubscriberRepository,
        ChannelService,
        AttachmentService,
        AttachmentRepository,
        MenuService,
        MenuRepository,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: NlpService,
          useValue: {
            getNLP: jest.fn(() => undefined),
          },
        },
        {
          provide: SettingService,
          useValue: {
            getConfig: jest.fn(() => ({
              chatbot: { lang: { default: 'fr' } },
            })),
            getSettings: jest.fn(() => ({})),
          },
        },
        EventEmitter2,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        LoggerService,
      ],
    }).compile();
    messageService = module.get<MessageService>(MessageService);
    userService = module.get<UserService>(UserService);
    subscriberService = module.get<SubscriberService>(SubscriberService);
    messageController = module.get<MessageController>(MessageController);
    message = await messageService.findOne({ mid: 'mid-1' });
    sender = await subscriberService.findOne(message.sender);
    recipient = await subscriberService.findOne(message.recipient);
    user = await userService.findOne(message.sentBy);
    allSubscribers = await subscriberService.findAll();
    allUsers = await userService.findAll();
    allMessages = await messageService.findAll();
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('count', () => {
    it('should count messages', async () => {
      jest.spyOn(messageService, 'count');
      const result = await messageController.filterCount();

      expect(messageService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: messageFixtures.length });
    });
  });

  describe('findOne', () => {
    it('should find message by id, and populate its corresponding sender and recipient', async () => {
      jest.spyOn(messageService, 'findOneAndPopulate');
      const result = await messageController.findOne(message.id, [
        'sender',
        'recipient',
      ]);

      expect(messageService.findOneAndPopulate).toHaveBeenCalledWith(
        message.id,
      );
      expect(result).toEqualPayload({
        ...messageFixtures.find(({ mid }) => mid === message.mid),
        sender,
        recipient,
        sentBy: user.id,
      });
    });
    it('should find message by id', async () => {
      jest.spyOn(messageService, 'findOne');
      const result = await messageController.findOne(message.id, []);

      expect(messageService.findOne).toHaveBeenCalledWith(message.id);
      expect(result).toEqualPayload({
        ...messageFixtures.find(({ mid }) => mid === message.mid),
        sender: sender.id,
        recipient: recipient.id,
        sentBy: user.id,
      });
    });
  });

  describe('findPage', () => {
    const pageQuery = getPageQuery<Message>();
    it('should find messages', async () => {
      jest.spyOn(messageService, 'findPage');
      const result = await messageController.findPage(pageQuery, [], {});
      const messagesWithSenderAndRecipient = allMessages.map((message) => ({
        ...message,
        sender: allSubscribers.find(({ id }) => id === message['sender']).id,
        recipient: allSubscribers.find(({ id }) => id === message['recipient'])
          .id,
        sentBy: allUsers.find(({ id }) => id === message['sentBy']).id,
      }));

      expect(messageService.findPage).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(messagesWithSenderAndRecipient);
    });

    it('should find messages, and foreach message populate the corresponding sender and recipient', async () => {
      jest.spyOn(messageService, 'findPageAndPopulate');
      const result = await messageController.findPage(
        pageQuery,
        ['sender', 'recipient'],
        {},
      );
      const messages = allMessages.map((message) => ({
        ...message,
        sender: allSubscribers.find(({ id }) => id === message['sender']),
        recipient: allSubscribers.find(({ id }) => id === message['recipient']),
        sentBy: allUsers.find(({ id }) => id === message['sentBy']).id,
      }));

      expect(messageService.findPageAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
      );
      expect(result).toEqualPayload(messages);
    });
  });
});
