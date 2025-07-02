/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { UserRepository } from '@/user/repositories/user.repository';
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

import { Message } from '../schemas/message.schema';
import { AnyMessage } from '../schemas/types/message';

import { MessageRepository } from './message.repository';
import { SubscriberRepository } from './subscriber.repository';

describe('MessageRepository', () => {
  let messageRepository: MessageRepository;
  let userRepository: UserRepository;
  let subscriberRepository: SubscriberRepository;
  let messageModel: Model<Message>;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installMessageFixtures)],
      providers: [MessageRepository, SubscriberRepository, UserRepository],
    });
    [messageRepository, userRepository, subscriberRepository, messageModel] =
      await getMocks([
        MessageRepository,
        UserRepository,
        SubscriberRepository,
        getModelToken(Message.name),
      ]);
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findOneAndPopulate', () => {
    it('should find one message by id, and populate its sender and recipient', async () => {
      jest.spyOn(messageModel, 'findById');
      const message = (await messageRepository.findOne({ mid: 'mid-1' }))!;
      const sender = await subscriberRepository.findOne(message!['sender']);
      const recipient = await subscriberRepository.findOne(
        message!['recipient'],
      );
      const user = (await userRepository.findOne(message!['sentBy']))!;
      const result = await messageRepository.findOneAndPopulate(message.id);

      expect(messageModel.findById).toHaveBeenCalledWith(message.id, undefined);
      expect(result).toEqualPayload({
        ...messageFixtures.find(({ mid }) => mid === message.mid),
        sender,
        recipient,
        sentBy: user.id,
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should find one messages, and foreach message populate its sender and recipient', async () => {
      jest.spyOn(messageModel, 'find');
      const pageQuery = getPageQuery<AnyMessage>();
      const result = await messageRepository.findAndPopulate({}, pageQuery);
      const allSubscribers = await subscriberRepository.findAll();
      const allUsers = await userRepository.findAll();
      const allMessages = await messageRepository.findAll();
      const messages = allMessages.map((message) => ({
        ...message,
        sender: allSubscribers.find(({ id }) => id === message['sender']),
        recipient: allSubscribers.find(({ id }) => id === message['recipient']),
        sentBy: allUsers.find(({ id }) => id === message['sentBy'])?.id,
      }));

      expect(messageModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(messages);
    });
  });
});
