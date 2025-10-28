/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { User } from '@/user/dto/user.dto';
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
import { buildTestingMocks } from '@/utils/test/utils';

import { Message } from '../dto/message.dto';
import { Subscriber } from '../dto/subscriber.dto';
import { MessageService } from '../services/message.service';
import { SubscriberService } from '../services/subscriber.service';

import { MessageController } from './message.controller';

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
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [MessageController],
      imports: [rootMongooseTestModule(installMessageFixtures)],
      providers: [UserService],
    });
    [messageService, userService, subscriberService, messageController] =
      await getMocks([
        MessageService,
        UserService,
        SubscriberService,
        MessageController,
      ]);
    message = (await messageService.findOne({ mid: 'mid-1' }))!;
    sender = (await subscriberService.findOne(message.sender!))!;
    recipient = (await subscriberService.findOne(message.recipient!))!;
    user = (await userService.findOne(message.sentBy!))!;
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
      jest.spyOn(messageService, 'find');
      const result = await messageController.findPage(pageQuery, [], {});
      const messagesWithSenderAndRecipient = allMessages.map((message) => ({
        ...message,
        sender: allSubscribers.find(({ id }) => id === message.sender)?.id,
        recipient: allSubscribers.find(({ id }) => id === message.recipient)
          ?.id,
        sentBy: allUsers.find(({ id }) => id === message.sentBy)?.id,
      }));

      expect(messageService.find).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(messagesWithSenderAndRecipient);
    });

    it('should find messages, and foreach message populate the corresponding sender and recipient', async () => {
      jest.spyOn(messageService, 'findAndPopulate');
      const result = await messageController.findPage(
        pageQuery,
        ['sender', 'recipient'],
        {},
      );
      const messages = allMessages.map((message) => ({
        ...message,
        sender: allSubscribers.find(({ id }) => id === message.sender),
        recipient: allSubscribers.find(({ id }) => id === message.recipient),
        sentBy: allUsers.find(({ id }) => id === message.sentBy)?.id,
      }));

      expect(messageService.findAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
      );
      expect(result).toEqualPayload(messages);
    });
  });
});
