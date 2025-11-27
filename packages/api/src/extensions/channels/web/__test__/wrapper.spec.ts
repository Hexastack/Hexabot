/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';

import { Attachment } from '@/attachment/dto/attachment.dto';
import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { MessageOrmEntity } from '@/chat/entities/message.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { MessageService } from '@/chat/services/message.service';
import { IncomingMessageType, StdEventType } from '@/chat/types/message';
import { MenuOrmEntity } from '@/cms/entities/menu.entity';
import { MenuService } from '@/cms/services/menu.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserProfileOrmEntity } from '@/user/entities/user-profile.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
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
        entities: [
          UserProfileOrmEntity,
          AttachmentOrmEntity,
          MessageOrmEntity,
          SubscriberOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          BlockOrmEntity,
          CategoryOrmEntity,
          MenuOrmEntity,
        ],
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
