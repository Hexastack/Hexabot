/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import {
  attachmentMessage,
  buttonsMessage,
  contentMessage,
  quickRepliesMessage,
  textMessage,
} from '@/channel/lib/__test__/common.mock';
import { MessageRepository } from '@/chat/repositories/message.repository';
import { SubscriberRepository } from '@/chat/repositories/subscriber.repository';
import { LabelModel } from '@/chat/schemas/label.schema';
import { MessageModel } from '@/chat/schemas/message.schema';
import { SubscriberModel } from '@/chat/schemas/subscriber.schema';
import { OutgoingMessageFormat } from '@/chat/schemas/types/message';
import { MessageService } from '@/chat/services/message.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { MenuRepository } from '@/cms/repositories/menu.repository';
import { MenuModel } from '@/cms/schemas/menu.schema';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';
import { UserModel } from '@/user/schemas/user.schema';
import { installMessageFixtures } from '@/utils/test/fixtures/message';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { SocketEventDispatcherService } from '@/websocket/services/socket-event-dispatcher.service';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import OfflineHandler from '../index.channel';

import {
  offlineAttachment,
  offlineButtons,
  offlineCarousel,
  offlineList,
  offlineQuickReplies,
  offlineText,
} from './data.mock';

describe('Offline Handler', () => {
  let subscriberService: SubscriberService;
  let handler: OfflineHandler;
  const offlineSettings = {};

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(async () => {
          await installMessageFixtures();
        }),
        MongooseModule.forFeature([
          SubscriberModel,
          AttachmentModel,
          MessageModel,
          MenuModel,
          LabelModel,
          UserModel,
        ]),
      ],
      providers: [
        {
          provide: SettingService,
          useValue: {
            getConfig: jest.fn(() => ({
              chatbot: { lang: { default: 'fr' } },
            })),
            getSettings: jest.fn(() => ({
              offline: offlineSettings,
            })),
          },
        },
        ChannelService,
        WebsocketGateway,
        SocketEventDispatcherService,
        SubscriberService,
        SubscriberRepository,
        AttachmentService,
        AttachmentRepository,
        MessageService,
        MessageRepository,
        MenuService,
        MenuRepository,
        OfflineHandler,
        EventEmitter2,
        LoggerService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();
    subscriberService = module.get<SubscriberService>(SubscriberService);
    handler = module.get<OfflineHandler>(OfflineHandler);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  it('should have correct name', () => {
    expect(handler).toBeDefined();
    expect(handler.getChannel()).toEqual('offline');
  });

  it('should format text properly', () => {
    const formatted = handler._textFormat(textMessage, {});
    expect(formatted).toEqual(offlineText);
  });

  it('should format quick replies properly', () => {
    const formatted = handler._quickRepliesFormat(quickRepliesMessage, {});
    expect(formatted).toEqual(offlineQuickReplies);
  });

  it('should format buttons properly', () => {
    const formatted = handler._buttonsFormat(buttonsMessage, {});
    expect(formatted).toEqual(offlineButtons);
  });

  it('should format list properly', () => {
    const formatted = handler._listFormat(contentMessage, {
      content: contentMessage.options,
    });
    expect(formatted).toEqual(offlineList);
  });

  it('should format carousel properly', () => {
    const formatted = handler._carouselFormat(contentMessage, {
      content: {
        ...contentMessage.options,
        display: OutgoingMessageFormat.carousel,
      },
    });
    expect(formatted).toEqual(offlineCarousel);
  });

  it('should format attachment properly', () => {
    const formatted = handler._attachmentFormat(attachmentMessage, {});
    expect(formatted).toEqual(offlineAttachment);
  });

  it('creates a new subscriber if needed + set a new session', async () => {
    const req = {
      isSocket: false,
      query: { first_name: 'New', last_name: 'Subscriber' },
      session: {},
      headers: { 'user-agent': 'browser' },
      user: {},
    } as any as Request;

    const generatedId = 'offline-test';
    const clearMock = jest
      .spyOn(handler, 'generateId')
      .mockImplementation(() => generatedId);
    const subscriber = await handler['getOrCreateSession'](req);
    const expectedAttrs = {
      assignedAt: null,
      assignedTo: null,
      channel: {
        agent: req.headers['user-agent'],
        ipAddress: '0.0.0.0',
        isSocket: false,
        name: 'offline',
      },
      country: '',
      first_name: req.query.first_name,
      foreign_id: generatedId,
      gender: 'male',
      labels: [],
      last_name: req.query.last_name,
      locale: '',
      timezone: 0,
    };
    const subscriberAttrs = Object.keys(expectedAttrs).reduce((acc, curr) => {
      acc[curr] = subscriber[curr];
      return acc;
    }, {});
    expect(subscriberAttrs).toEqual(expectedAttrs);
    expect(req.session).toEqual({
      offline: {
        isSocket: false,
        messageQueue: [],
        polling: false,
        profile: subscriber,
      },
    });
    clearMock.mockRestore();

    // Subsequent request
    const subscriber2nd = await handler['getOrCreateSession'](req);
    expect(subscriber2nd.id).toBe(subscriber.id);
    expect(req.session).toEqual({
      offline: {
        isSocket: false,
        messageQueue: [],
        polling: false,
        profile: subscriber2nd,
      },
    });
  });

  it('subscribes and returns the message history', async () => {
    const subscriber = await subscriberService.findOneByForeignIdAndPopulate(
      'foreign-id-offline-1',
    );
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const req = {
      isSocket: true,
      query: { since: tomorrow },
      session: {},
      headers: { 'user-agent': 'browser' },
      socket: {
        join: (_foreignId: string) => {},
      },
    } as any as SocketRequest;
    const res = {
      status: (code: number) => {
        expect(code).toEqual(200);
        return res;
      },
      json: (payload: any) => {
        expect(payload.messages.length).toEqual(3);
      },
    } as any as SocketResponse;
    req.session = {
      cookie: { originalMaxAge: 0 },
      offline: {
        isSocket: true,
        messageQueue: [],
        polling: false,
        profile: subscriber,
      },
    };
    let joinedSocket = false;

    const clearMock = jest
      .spyOn(req.socket, 'join')
      .mockImplementation((foreignId: string) => {
        expect(foreignId).toBe(subscriber.foreign_id);
        joinedSocket = true;
      });
    await handler['subscribe'](req, res);
    expect(joinedSocket).toBe(true);
    clearMock.mockRestore();
  });
});
