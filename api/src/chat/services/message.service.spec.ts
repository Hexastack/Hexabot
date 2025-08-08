/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { UserRepository } from '@/user/repositories/user.repository';
import { User } from '@/user/schemas/user.schema';
import {
  installMessageFixtures,
  messageFixtures,
} from '@/utils/test/fixtures/message';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { IOOutgoingSubscribeMessage } from '@/websocket/pipes/io-message.pipe';
import { Room } from '@/websocket/types';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { MessageRepository } from '../repositories/message.repository';
import { Message } from '../schemas/message.schema';
import { Subscriber } from '../schemas/subscriber.schema';

import { SubscriberRepository } from './../repositories/subscriber.repository';
import { MessageService } from './message.service';

describe('MessageService', () => {
  let messageRepository: MessageRepository;
  let messageService: MessageService;
  let subscriberRepository: SubscriberRepository;
  let userRepository: UserRepository;
  let allMessages: Message[];
  let allSubscribers: Subscriber[];
  let allUsers: User[];
  let message: Message;
  let sender: Subscriber;
  let recipient: Subscriber;
  let messagesWithSenderAndRecipient: Message[];
  let user: User;
  let mockGateway: Partial<WebsocketGateway>;
  let mockMessageService: MessageService;
  const SESSION_ID = 'session-123';
  const SUCCESS_PAYLOAD: IOOutgoingSubscribeMessage = {
    success: true,
    subscribe: Room.MESSAGE,
  };

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installMessageFixtures)],
      providers: [MessageService, SubscriberRepository, UserRepository],
    });
    [messageService, messageRepository, subscriberRepository, userRepository] =
      await getMocks([
        MessageService,
        MessageRepository,
        SubscriberRepository,
        UserRepository,
      ]);
    allSubscribers = await subscriberRepository.findAll();
    allUsers = await userRepository.findAll();
    allMessages = await messageRepository.findAll();
    message = (await messageRepository.findOne({ mid: 'mid-1' }))!;
    sender = (await subscriberRepository.findOne(message.sender!))!;
    recipient = (await subscriberRepository.findOne(message.recipient!))!;
    user = (await userRepository.findOne(message.sentBy!))!;
    messagesWithSenderAndRecipient = allMessages.map((message) => ({
      ...message,
      sender: allSubscribers.find(({ id }) => id === message.sender)?.id,
      recipient: allSubscribers.find(({ id }) => id === message.recipient)?.id,
      sentBy: allUsers.find(({ id }) => id === message.sentBy)?.id,
    }));
    mockGateway = {
      joinNotificationSockets: jest.fn(),
    };
    mockMessageService = new MessageService({} as any, mockGateway as any);
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('subscribe', () => {
    it('should join Notification sockets message room and return a success response', async () => {
      const req = {
        request: {
          session: { passport: { user: { id: SESSION_ID } } },
        },
      };
      const res = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      };

      await mockMessageService.subscribe(req as any, res as any);

      expect(mockGateway.joinNotificationSockets).toHaveBeenCalledWith(
        req,
        Room.MESSAGE,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(SUCCESS_PAYLOAD);
    });
  });

  describe('findOneAndPopulate', () => {
    it('should find message by id, and populate its corresponding sender and recipient', async () => {
      jest.spyOn(messageRepository, 'findOneAndPopulate');
      const result = await messageService.findOneAndPopulate(message.id);

      expect(messageRepository.findOneAndPopulate).toHaveBeenCalledWith(
        message.id,
        undefined,
      );
      expect(result).toEqualPayload({
        ...messageFixtures.find(({ mid }) => mid === message.mid),
        sender,
        recipient,
        sentBy: user.id,
      });
    });
  });

  describe('findAndPopulate', () => {
    const pageQuery = getPageQuery<Message>();
    it('should find messages, and foreach message populate the corresponding sender and recipient', async () => {
      jest.spyOn(messageRepository, 'findAndPopulate');
      const result = await messageService.findAndPopulate({}, pageQuery);
      const messagesWithSenderAndRecipient = allMessages.map((message) => ({
        ...message,
        sender: allSubscribers.find(({ id }) => id === message.sender),
        recipient: allSubscribers.find(({ id }) => id === message.recipient),
        sentBy: allUsers.find(({ id }) => id === message.sentBy)?.id,
      }));

      expect(messageRepository.findAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
        undefined,
      );
      expect(result).toEqualPayload(messagesWithSenderAndRecipient);
    });
  });

  describe('findHistoryUntilDate', () => {
    it('should return history until given date', async () => {
      const until: Date = new Date(
        new Date().setMonth(new Date().getMonth() + 1),
      );
      const result = await messageService.findHistoryUntilDate(
        sender!,
        until,
        30,
      );
      const historyMessages = messagesWithSenderAndRecipient.filter(
        (message) => message.createdAt <= until,
      );

      expect(result).toEqualPayload(historyMessages);
    });
  });

  describe('findHistorySinceDate', () => {
    it('should return history since given date', async () => {
      const since: Date = new Date();
      const result = await messageService.findHistorySinceDate(
        sender!,
        since,
        30,
      );
      const messagesWithSenderAndRecipient = allMessages.map((message) => ({
        ...message,
        sender: allSubscribers.find(({ id }) => id === message.sender)?.id,
        recipient: allSubscribers.find(({ id }) => id === message.recipient)
          ?.id,
        sentBy: allUsers.find(({ id }) => id === message.sentBy)?.id,
      }));
      const historyMessages = messagesWithSenderAndRecipient.filter(
        (message) => message.createdAt > since,
      );

      expect(result).toEqual(
        historyMessages.sort((message1, message2) =>
          sortRowsBy(message1, message2, 'createdAt', 'asc'),
        ),
      );
    });
  });
});
