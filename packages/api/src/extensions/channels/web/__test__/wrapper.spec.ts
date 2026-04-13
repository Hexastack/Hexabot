/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';

import { Attachment } from '@/attachment/dto/attachment.dto';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ChannelService } from '@/channel/channel.service';
import { MessageService } from '@/chat/services/message.service';
import { ThreadService } from '@/chat/services/thread.service';
import { IncomingMessageType, StdEventType } from '@/chat/types/message';
import { MenuService } from '@/cms/services/menu.service';
import { installSubscriberFixturesTypeOrm } from '@/utils/test/fixtures/subscriber';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import WebChannelHandler from '../index.channel';
import { WEB_CHANNEL_NAME } from '../web-channel.settings';
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
  } as jest.Mocked<Pick<WebsocketGateway, 'broadcast'>>;
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
        ChannelService,
        JwtService,
        ThreadService,
        WebChannelHandler,
        I18nServiceProvider,
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
    expect(event.buildInput()).not.toHaveProperty('channel');
    expect(event.buildInput()).not.toHaveProperty('sender');
    expect(event.getContextData()).toEqual(
      expect.objectContaining({
        channel: {
          ...expected.channelData,
          name: WEB_CHANNEL_NAME,
        },
      }),
    );
    expect(event.getContextData()).not.toHaveProperty('messageId');
    expect(event.getContextData()).not.toHaveProperty('eventType');
    expect(event.getContextData()).not.toHaveProperty('messageType');
  });

  it('keeps workflow id as transient event state', () => {
    const [_testCase, e, expected] = webEvents[0];
    const workflowId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const event = new WebEventWrapper(
      handler as unknown as WebChannelHandler,
      e,
      expected.channelData,
    );

    expect(event.getWorkflowId()).toBeUndefined();

    event.setWorkflowId(workflowId);

    expect(event.getWorkflowId()).toBe(workflowId);
    expect(event.buildInput()).not.toHaveProperty('workflowId');
    expect(event.getContextData()).not.toHaveProperty('workflowId');
  });
});
