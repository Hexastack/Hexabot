/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

import {
  attachmentMessage,
  buttonsMessage,
  contentMessage,
  quickRepliesMessage,
  textMessage,
} from '@/channel/lib/__test__/common.mock';
import { OutgoingMessageFormat } from '@/chat/schemas/types/message';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { installMessageFixtures } from '@/utils/test/fixtures/message';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';

import WebChannelHandler from '../index.channel';

import {
  webAttachment,
  webButtons,
  webCarousel,
  webList,
  webQuickReplies,
  webText,
} from './data.mock';

describe('WebChannelHandler', () => {
  let subscriberService: SubscriberService;
  let handler: WebChannelHandler;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['LabelModel', 'UserModel'],
      autoInjectFrom: ['providers'],
      imports: [
        rootMongooseTestModule(async () => {
          await installMessageFixtures();
        }),
      ],
      providers: [
        JwtService,
        WebChannelHandler,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [subscriberService, handler] = await getMocks([
      SubscriberService,
      WebChannelHandler,
    ]);

    jest
      .spyOn(handler, 'getPublicUrl')
      .mockResolvedValue('http://public.url/download/filename.extension?t=any');
  });

  afterAll(async () => {
    jest.restoreAllMocks();
    await closeInMongodConnection();
  });

  it('should have correct name', () => {
    expect(handler).toBeDefined();
    expect(handler.getName()).toEqual('web-channel');
  });

  it('should allow the request if the origin is in the allowed domains', async () => {
    const req = {
      headers: {
        origin: 'https://example.com',
      },
      method: 'GET',
    } as unknown as Request;

    const res = {
      set: jest.fn(),
    } as any;

    jest.spyOn(handler, 'getSettings').mockResolvedValue({
      allowed_domains:
        'https://example.com/,https://test.com,http://invalid-url',
    });

    await expect(handler['validateCors'](req, res)).resolves.not.toThrow();

    expect(res.set).toHaveBeenCalledWith(
      'Access-Control-Allow-Origin',
      'https://example.com',
    );
    expect(res.set).toHaveBeenCalledWith(
      'Access-Control-Allow-Credentials',
      'true',
    );
  });

  it('should reject the request if the origin is not in the allowed domains', async () => {
    const req = {
      headers: {
        origin: 'https://notallowed.com',
      },
      method: 'GET',
    } as unknown as Request;

    jest.spyOn(handler, 'getSettings').mockResolvedValue({
      allowed_domains:
        'https://example.com/,https://test.com,http://invalid-url',
    });

    const res = {
      set: jest.fn(),
    } as any;

    await expect(handler['validateCors'](req, res)).rejects.toThrow(
      'CORS - Domain not allowed!',
    );

    expect(res.set).toHaveBeenCalledWith('Access-Control-Allow-Origin', '');
  });

  it('should format text properly', () => {
    const formatted = handler._textFormat(textMessage, {});
    expect(formatted).toEqual(webText);
  });

  it('should format quick replies properly', () => {
    const formatted = handler._quickRepliesFormat(quickRepliesMessage, {});
    expect(formatted).toEqual(webQuickReplies);
  });

  it('should format buttons properly', () => {
    const formatted = handler._buttonsFormat(buttonsMessage, {});
    expect(formatted).toEqual(webButtons);
  });

  it('should format list properly', async () => {
    const formatted = await handler._listFormat(contentMessage, {
      content: contentMessage.options,
    });
    expect(formatted).toEqual(webList);
  });

  it('should format carousel properly', async () => {
    const formatted = await handler._carouselFormat(contentMessage, {
      content: {
        ...contentMessage.options,
        display: OutgoingMessageFormat.carousel,
      },
    });
    expect(formatted).toEqual(webCarousel);
  });

  it('should format attachment properly', async () => {
    const formatted = await handler._attachmentFormat(attachmentMessage, {});
    expect(formatted).toEqual(webAttachment);
  });

  it('creates a new subscriber if needed + set a new session', async () => {
    const req = {
      isSocket: false,
      query: { first_name: 'New', last_name: 'Subscriber' },
      session: {},
      headers: { 'user-agent': 'browser' },
      user: {},
    } as any as Request;

    const generatedId = 'web-test';
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
        name: 'web-channel',
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
      web: {
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
      web: {
        isSocket: false,
        messageQueue: [],
        polling: false,
        profile: subscriber2nd,
      },
    });
  });

  it('subscribes and returns the message history', async () => {
    const subscriber =
      await subscriberService.findOneByForeignIdAndPopulate('foreign-id-web-1');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const req = {
      isSocket: true,
      query: { since: tomorrow },
      session: {
        cookie: { originalMaxAge: 0 },
        web: {
          isSocket: true,
          messageQueue: [],
          polling: false,
          profile: subscriber,
        },
      },
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
