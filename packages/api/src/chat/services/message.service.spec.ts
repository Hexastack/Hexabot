/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { Message, MessageFull } from '@/chat/dto/message.dto';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { MessageOrmEntity } from '@/chat/entities/message.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { MessageRepository } from '@/chat/repositories/message.repository';
import { MessageService } from '@/chat/services/message.service';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import {
  installMessageFixturesTypeOrm,
  messageFixtures,
} from '@hexabot/dev/fixtures/message';
import { closeTypeOrmConnections } from '@hexabot/dev/test';
import { buildTestingMocks } from '@hexabot/dev/utils';
import { IOOutgoingSubscribeMessage } from '@/websocket/pipes/io-message.pipe';
import { Room } from '@/websocket/types';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { BlockOrmEntity } from '../entities/block.entity';
import { CategoryOrmEntity } from '../entities/category.entity';

describe('MessageService (TypeORM)', () => {
  let module: TestingModule;
  let messageService: MessageService;
  let messageRepository: MessageRepository;

  let plainMessages: Message[];
  let populatedMessages: MessageFull[];
  let referencePlain: Message;
  let referencePopulated: MessageFull;
  let referenceSubscriber: Subscriber;
  let subscriberMessagesAsc: Message[];

  const SESSION_ID = 'session-123';
  const SUCCESS_PAYLOAD: IOOutgoingSubscribeMessage = {
    success: true,
    subscribe: Room.MESSAGE,
  };
  const websocketGatewayMock: Partial<WebsocketGateway> = {
    joinNotificationSockets: jest.fn(),
  };
  const orderByCreatedAtAsc = { order: { createdAt: 'ASC' as const } };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        MessageService,
        MessageRepository,
        {
          provide: WebsocketGateway,
          useValue: websocketGatewayMock,
        },
      ],
      typeorm: {
        entities: [
          MessageOrmEntity,
          SubscriberOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          AttachmentOrmEntity,
          BlockOrmEntity,
          CategoryOrmEntity,
        ],
        fixtures: installMessageFixturesTypeOrm,
      },
    });

    module = testing.module;

    [messageService, messageRepository] = await testing.getMocks([
      MessageService,
      MessageRepository,
    ]);

    plainMessages = await messageService.find(orderByCreatedAtAsc);
    populatedMessages =
      await messageService.findAndPopulate(orderByCreatedAtAsc);

    if (!plainMessages.length || !populatedMessages.length) {
      throw new Error('Expected seeded message fixtures to be available');
    }

    const targetMid = messageFixtures[0]?.mid ?? null;
    referencePlain =
      plainMessages.find((message) => message.mid === targetMid) ??
      plainMessages[0];
    referencePopulated =
      populatedMessages.find((message) => message.mid === targetMid) ??
      populatedMessages[0];

    if (!referencePopulated) {
      throw new Error('Unable to resolve a reference message from fixtures');
    }

    if (!referencePopulated.sender) {
      throw new Error('Expected reference message to include a sender');
    }

    referenceSubscriber = referencePopulated.sender;
    subscriberMessagesAsc = (messageFixtures as Message[]).sort(
      (a, b) => b.createdAt!.getTime() - a.createdAt!.getTime(),
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('subscribe', () => {
    it('joins the message room and returns a success response', async () => {
      const req = {
        request: {
          session: { passport: { user: { id: SESSION_ID } } },
        },
      };
      const res = {
        json: jest.fn().mockReturnValue(SUCCESS_PAYLOAD),
        status: jest.fn().mockReturnThis(),
      };
      const result = await messageService.subscribe(req as any, res as any);

      expect(websocketGatewayMock.joinNotificationSockets).toHaveBeenCalledWith(
        req,
        Room.MESSAGE,
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(SUCCESS_PAYLOAD);
      expect(result).toEqual(SUCCESS_PAYLOAD);
    });
  });

  describe('findOneAndPopulate', () => {
    it('finds a message by id and populates relations', async () => {
      const spy = jest.spyOn(messageRepository, 'findOneAndPopulate');
      const result = await messageService.findOneAndPopulate(referencePlain.id);

      expect(spy).toHaveBeenCalledWith(referencePlain.id);
      expect(result).toEqualPayload(referencePopulated);

      spy.mockRestore();
    });
  });

  describe('findAndPopulate', () => {
    it('retrieves messages and populates requested relations', async () => {
      const spy = jest.spyOn(messageRepository, 'findAndPopulate');
      const result = await messageService.findAndPopulate(orderByCreatedAtAsc);

      expect(spy).toHaveBeenCalledWith(orderByCreatedAtAsc);
      expect(result).toEqualPayload(populatedMessages);

      spy.mockRestore();
    });
  });

  describe('findHistoryUntilDate', () => {
    it('returns history until the specified date ordered from newest to oldest', async () => {
      const until = new Date('2024-12-31T23:59:59.999Z');
      const result = await messageService.findHistoryUntilDate(
        referenceSubscriber,
        until,
        30,
      );
      const expected = subscriberMessagesAsc
        .filter((message) => message.createdAt! < until)
        .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime());

      expect(result).toEqualPayload(expected);
    });
  });

  describe('findHistorySinceDate', () => {
    it('returns history since the specified date ordered from oldest to newest', async () => {
      const since = subscriberMessagesAsc[0].createdAt;
      const result = await messageService.findHistorySinceDate(
        referenceSubscriber,
        since,
        30,
      );
      const expected = subscriberMessagesAsc.filter(
        (message) => message.createdAt! > since,
      );

      expect(result).toEqualPayload(expected, [
        'id',
        'createdAt',
        'updatedAt',
        'recipient',
        'sender',
        'sentBy',
      ]);
    });
  });

  describe('findLastMessages', () => {
    it('returns the most recent messages for a subscriber in chronological order', async () => {
      const limit = 2;
      const result = await messageService.findLastMessages(
        referenceSubscriber,
        limit,
      );
      const expected = subscriberMessagesAsc.slice(0, limit);

      expect(result).toEqualPayload(expected, [
        'id',
        'createdAt',
        'updatedAt',
        'recipient',
        'sender',
        'sentBy',
      ]);
    });
  });
});
