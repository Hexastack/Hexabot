/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { ChannelService } from '@/channel/channel.service';
import { MessageRepository } from '@/chat/repositories/message.repository';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import {
  installMessageFixturesTypeOrm,
  messageFixtures,
} from '@/utils/test/fixtures/message';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { Message, MessageFull } from '../dto/message.dto';

import { MessageController } from './message.controller';

describe('MessageController (TypeORM)', () => {
  let module: TestingModule;
  let messageController: MessageController;
  let messageService: MessageService;

  let totalMessages: number;
  let plainMessages: Message[];
  let populatedMessages: MessageFull[];
  let referencePlain: Message;
  let referencePopulated: MessageFull;

  const subscriberServiceMock: Partial<SubscriberService> = {
    findOne: jest.fn(),
    findOneAndPopulate: jest.fn(),
  };
  const channelServiceMock: Partial<ChannelService> = {
    findChannel: jest.fn(),
    getChannelHandler: jest.fn(),
  };
  const websocketGatewayMock: Partial<WebsocketGateway> = {
    joinNotificationSockets: jest.fn(),
  };
  const defaultOrder = { order: { createdAt: 'ASC' as const } };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [MessageController],
      providers: [
        MessageService,
        MessageRepository,
        {
          provide: SubscriberService,
          useValue: subscriberServiceMock,
        },
        {
          provide: ChannelService,
          useValue: channelServiceMock,
        },
        {
          provide: WebsocketGateway,
          useValue: websocketGatewayMock,
        },
      ],
      typeorm: {
        fixtures: installMessageFixturesTypeOrm,
      },
    });

    module = testing.module;

    [messageController, messageService] = await testing.getMocks([
      MessageController,
      MessageService,
    ]);

    totalMessages = await messageService.count();
    plainMessages = await messageService.find(defaultOrder);
    populatedMessages = await messageService.findAndPopulate(defaultOrder);

    const targetMid = messageFixtures[0]?.mid ?? null;

    referencePlain =
      plainMessages.find((message) => message.mid === targetMid) ??
      plainMessages[0];

    referencePopulated =
      populatedMessages.find((message) => message.mid === targetMid) ??
      populatedMessages[0];

    if (!referencePlain || !referencePopulated) {
      throw new Error('Expected message fixtures to seed at least one message');
    }
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('count', () => {
    it('should count messages', async () => {
      const countSpy = jest.spyOn(messageService, 'count');
      const result = await messageController.filterCount();

      expect(countSpy).toHaveBeenCalledWith({});
      expect(result).toEqual({ count: totalMessages });
    });
  });

  describe('findOne', () => {
    it('should find message by id with populated relations', async () => {
      const populateSpy = jest.spyOn(messageService, 'findOneAndPopulate');
      const result = await messageController.findOne(referencePlain.id, [
        'sender',
        'recipient',
        'sentBy',
      ]);

      expect(populateSpy).toHaveBeenCalledWith(referencePlain.id);
      expect(result).toEqualPayload(referencePopulated);
    });

    it('should find message by id without populating relations', async () => {
      const findSpy = jest.spyOn(messageService, 'findOne');
      const result = await messageController.findOne(referencePlain.id, []);

      expect(findSpy).toHaveBeenCalledWith(referencePlain.id);
      expect(result).toEqualPayload(referencePlain);
    });
  });

  describe('findPage', () => {
    it('should find messages without populating relations when none requested', async () => {
      const findSpy = jest.spyOn(messageService, 'find');
      const result = await messageController.findPage([], defaultOrder);

      expect(findSpy).toHaveBeenCalledWith(defaultOrder);
      expect(result).toEqualPayload(plainMessages);
    });

    it('should find messages and populate requested relations', async () => {
      const populateSpy = jest.spyOn(messageService, 'findAndPopulate');
      const result = await messageController.findPage(
        ['sender', 'recipient', 'sentBy'],
        defaultOrder,
      );

      expect(populateSpy).toHaveBeenCalledWith(defaultOrder);
      expect(result).toEqualPayload(populatedMessages);
    });
  });
});
