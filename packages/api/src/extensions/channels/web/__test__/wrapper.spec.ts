/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';

import { Attachment } from '@/attachment/dto/attachment.dto';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { MessageService } from '@/chat/services/message.service';
import { IncomingMessageType, StdEventType } from '@/chat/types/message';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { installSubscriberFixturesTypeOrm } from '@/utils/test/fixtures/subscriber';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import WebChannelHandler from '../index.channel';
import { WEB_CHANNEL_NAME } from '../settings';
import WebEventWrapper from '../wrapper';

import { webEvents } from './events.mock';

const ATTACHMENT_ID = '99999999-9999-4999-9999-999999999999';

describe(`Web event wrapper`, () => {
  let module: TestingModule;
  let handler: WebChannelHandler;
  const menuServiceMock = {
    getTree: jest.fn().mockResolvedValue([]),
  } as jest.Mocked<Pick<MenuService, 'getTree'>>;
  const attachmentServiceMock = {
    findOne: jest.fn(),
    store: jest.fn(),
    create: jest.fn(),
  } as jest.Mocked<Pick<AttachmentService, 'findOne' | 'store' | 'create'>>;
  const websocketGatewayMock = {
    broadcast: jest.fn(),
    joinNotificationSockets: jest.fn(),
  } as jest.Mocked<
    Pick<WebsocketGateway, 'broadcast' | 'joinNotificationSockets'>
  >;
  const messageServiceMock = {
    findHistoryUntilDate: jest.fn(),
    findHistorySinceDate: jest.fn(),
    findLastMessages: jest.fn(),
  } as jest.Mocked<
    Pick<
      MessageService,
      'findHistoryUntilDate' | 'findHistorySinceDate' | 'findLastMessages'
    >
  >;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        JwtService,
        WebChannelHandler,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: MenuService,
          useValue: menuServiceMock,
        },
        {
          provide: AttachmentService,
          useValue: attachmentServiceMock,
        },
        {
          provide: WebsocketGateway,
          useValue: websocketGatewayMock,
        },
        {
          provide: MessageService,
          useValue: messageServiceMock,
        },
      ],
      typeorm: {
        fixtures: installSubscriberFixturesTypeOrm,
      },
    });
    module = testing.module;
    [handler] = await testing.getMocks([WebChannelHandler]);
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

  test.each(webEvents)('should wrap event : %s', (_testCase, e, expected) => {
    const event = new WebEventWrapper(
      handler as unknown as WebChannelHandler,
      e,
      expected.channelData,
    );

    if (
      event._adapter.eventType === StdEventType.message &&
      event._adapter.messageType === IncomingMessageType.attachments
    ) {
      event._adapter.attachment = {
        id: ATTACHMENT_ID,
        type: 'image/png',
        name: 'filename.extension',
      } as Attachment;
    }

    expect(event.getChannelData()).toEqual({
      ...expected.channelData,
      name: WEB_CHANNEL_NAME,
    });
    expect(event.getId()).toEqual(expected.id);
    expect(event.getEventType()).toEqual(expected.eventType);
    expect(event.getMessageType()).toEqual(expected.messageType);
    expect(event.getPayload()).toEqual(expected.payload);
    expect(event.getMessage()).toEqual(expected.message);
    expect(event.getDeliveredMessages()).toEqual([]);
  });
});
