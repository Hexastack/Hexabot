/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentService } from '@/attachment/services/attachment.service';
import EventWrapper from '@/channel/lib/EventWrapper';
import { VIEW_MORE_PAYLOAD } from '@/chat/helpers/constants';
import { ConversationService } from '@/chat/services/conversation.service';
import { SubscriberService } from '@/chat/services/subscriber.service';
import { OutgoingMessageFormat } from '@/chat/types/message';
import { installContextVarFixturesTypeOrm } from '@/utils/test/fixtures/contextvar';
import { installConversationFixturesTypeOrm } from '@/utils/test/fixtures/conversation';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { Block } from '../dto/block.dto';

describe('ConversationService (TypeORM)', () => {
  let module: TestingModule;
  let conversationService: ConversationService;
  let subscriberService: SubscriberService;

  const attachmentServiceMock: jest.Mocked<Pick<AttachmentService, 'store'>> = {
    store: jest.fn(),
  };
  const gatewayMock: jest.Mocked<
    Pick<WebsocketGateway, 'joinNotificationSockets'>
  > = {
    joinNotificationSockets: jest.fn(),
  };

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        ConversationService,
        { provide: AttachmentService, useValue: attachmentServiceMock },
        { provide: WebsocketGateway, useValue: gatewayMock },
      ],
      typeorm: {
        fixtures: [
          installContextVarFixturesTypeOrm,
          installConversationFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;
    [conversationService, subscriberService] = await testing.getMocks([
      ConversationService,
      SubscriberService,
    ]);
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('ConversationService.storeContextData', () => {
    it('should enrich the conversation context and persist conversation + subscriber (permanent)', async () => {
      const subscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-messenger' },
      }))!;
      const conversation = (await conversationService.findOne({
        where: { sender: { id: subscriber.id } },
      }))!;
      const next = {
        id: 'block-1',
        capture_vars: [{ entity: -1, context_var: 'phone' }],
      } as Block;
      const mockPhone = '+1 514 678 9873';
      const event = {
        getMessageType: jest.fn().mockReturnValue('message'),
        getText: jest.fn().mockReturnValue(mockPhone),
        getPayload: jest.fn().mockReturnValue(undefined),
        getNLP: jest.fn().mockReturnValue(undefined),
        getMessage: jest.fn().mockReturnValue({
          text: mockPhone,
        }),
        getHandler: jest.fn().mockReturnValue({
          getName: jest.fn().mockReturnValue('messenger-channel'),
        }),
        getSender: jest.fn().mockReturnValue({
          id: subscriber.id,
          first_name: subscriber.first_name,
          last_name: subscriber.last_name,
          language: subscriber.language,
          context: {
            vars: {
              email: 'john.doe@mail.com',
            },
          },
        }),
        setSender: jest.fn(),
      } as unknown as EventWrapper<any, any>;
      const result = await conversationService.storeContextData(
        conversation,
        next,
        event,
        true,
      );

      expect(result.context.channel).toBe('messenger-channel');
      expect(result.context.text).toBe(mockPhone);
      expect(result.context.vars.phone).toBe(mockPhone);
      expect(result.context.user).toEqual(
        expect.objectContaining({
          id: subscriber.id,
          first_name: subscriber.first_name,
          last_name: subscriber.last_name,
          language: subscriber.language,
        }),
      );

      const updatedSubscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-messenger' },
      }))!;

      expect(updatedSubscriber.context.vars?.phone).toBe(mockPhone);

      // expect(event.setSender).toHaveBeenCalledWith(updatedSubscriber);
    });

    it('should capture an NLP entity value into context vars (non-permanent)', async () => {
      const subscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-messenger' },
      }))!;
      const conversation = (await conversationService.findOne({
        where: { sender: { id: subscriber.id } },
      }))!;
      const next = {
        id: 'block-1',
        capture_vars: [{ entity: 'country_code', context_var: 'country' }],
      } as Block;
      const mockMessage = 'Are you from the US?';
      const event = {
        getMessageType: jest.fn().mockReturnValue('message'),
        getText: jest.fn().mockReturnValue(mockMessage),
        getPayload: jest.fn().mockReturnValue(undefined),
        getNLP: jest.fn().mockReturnValue({
          entities: [
            {
              entity: 'country_code',
              value: 'US',
            },
          ],
        }),
        getMessage: jest.fn().mockReturnValue({
          text: mockMessage,
        }),
        getHandler: jest.fn().mockReturnValue({
          getName: jest.fn().mockReturnValue('messenger-channel'),
        }),
        getSender: jest.fn().mockReturnValue({
          id: subscriber.id,
          first_name: subscriber.first_name,
          last_name: subscriber.last_name,
          language: subscriber.language,
          context: {
            vars: {
              email: 'john.doe@mail.com',
            },
          },
        }),
        setSender: jest.fn(),
      } as unknown as EventWrapper<any, any>;
      const result = await conversationService.storeContextData(
        conversation,
        next,
        event,
        true,
      );

      expect(result.context.vars.country).toBe('US');
      const updatedSubscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-messenger' },
      }))!;
      expect(updatedSubscriber.context.vars?.country).toBe(undefined);
    });

    it('should capture user coordinates when message type is "location"', async () => {
      const subscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-messenger' },
      }))!;
      const conversation = (await conversationService.findOne({
        where: { sender: { id: subscriber.id } },
      }))!;
      const next = {
        id: 'block-1',
        capture_vars: [{ entity: 'country_code', context_var: 'country' }],
      } as Block;
      const event = {
        getMessageType: jest.fn().mockReturnValue('location'),
        getText: jest.fn().mockReturnValue(''),
        getPayload: jest.fn().mockReturnValue(undefined),
        getNLP: jest.fn(),
        getMessage: jest.fn().mockReturnValue({
          coordinates: { lat: 36.8065, lon: 10.1815 },
        }),
        getHandler: jest.fn().mockReturnValue({
          getName: jest.fn().mockReturnValue('messenger-channel'),
        }),
        getSender: jest.fn().mockReturnValue({
          id: subscriber.id,
          first_name: subscriber.first_name,
          last_name: subscriber.last_name,
          language: subscriber.language,
          context: {
            vars: {
              email: 'john.doe@mail.com',
            },
          },
        }),
        setSender: jest.fn(),
      } as unknown as EventWrapper<any, any>;
      const result = await conversationService.storeContextData(
        conversation,
        next,
        event,
      );

      expect(result.context.user_location).toEqual({
        lat: 36.8065,
        lon: 10.1815,
      });
    });

    it('should increment skip when VIEW_MORE payload is received for list/carousel blocks', async () => {
      const subscriber = (await subscriberService.findOne({
        where: { foreign_id: 'foreign-id-messenger' },
      }))!;
      const conversation = (await conversationService.findOne({
        where: { sender: { id: subscriber.id } },
      }))!;
      const next = {
        id: 'block-1',
        capture_vars: [],
        options: {
          content: {
            display: OutgoingMessageFormat.list,
            limit: 10,
          },
        },
      } as unknown as Block;
      const event = {
        getMessageType: jest.fn().mockReturnValue('message'),
        getText: jest.fn().mockReturnValue('I would like to see the products'),
        getPayload: jest.fn().mockReturnValue(undefined),
        getNLP: jest.fn(),
        getMessage: jest.fn().mockReturnValue({
          text: 'I would like to see the products',
        }),
        getHandler: jest.fn().mockReturnValue({
          getName: jest.fn().mockReturnValue('messenger-channel'),
        }),
        getSender: jest.fn().mockReturnValue({
          id: subscriber.id,
          first_name: subscriber.first_name,
          last_name: subscriber.last_name,
          language: subscriber.language,
          context: {
            vars: {
              email: 'john.doe@mail.com',
            },
          },
        }),
        setSender: jest.fn(),
      } as unknown as EventWrapper<any, any>;
      const result1 = await conversationService.storeContextData(
        conversation,
        next,
        event,
      );

      expect(result1.context.skip['block-1']).toBe(0);

      const event2 = {
        getMessageType: jest.fn().mockReturnValue('postback'),
        getText: jest.fn().mockReturnValue('View more'),
        getPayload: jest.fn().mockReturnValue(VIEW_MORE_PAYLOAD),
        getNLP: jest.fn(),
        getMessage: jest.fn().mockReturnValue({
          coordinates: { lat: 36.8065, lon: 10.1815 },
        }),
        getHandler: jest.fn().mockReturnValue({
          getName: jest.fn().mockReturnValue('messenger-channel'),
        }),
        getSender: jest.fn().mockReturnValue({
          id: subscriber.id,
          first_name: subscriber.first_name,
          last_name: subscriber.last_name,
          language: subscriber.language,
          context: {
            vars: {
              email: 'john.doe@mail.com',
            },
          },
        }),
        setSender: jest.fn(),
      } as unknown as EventWrapper<any, any>;
      const result2 = await conversationService.storeContextData(
        conversation,
        next,
        event2,
      );

      expect(result2.context.skip['block-1']).toBe(10);
    });
  });
});
