/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import EventWrapper from '@/channel/lib/EventWrapper';
import { I18nService } from '@/i18n/services/i18n.service';
import { installContextVarFixtures } from '@/utils/test/fixtures/contextvar';
import { installConversationTypeFixtures } from '@/utils/test/fixtures/conversation';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { VIEW_MORE_PAYLOAD } from '../helpers/constants';
import { Block } from '../schemas/block.schema';
import { OutgoingMessageFormat } from '../schemas/types/message';

import { ConversationService } from './conversation.service';
import { SubscriberService } from './subscriber.service';

describe('ConversationService', () => {
  let conversationService: ConversationService;
  let subscriberService: SubscriberService;
  // let labelService: LabelService;
  // let subscriberRepository: SubscriberRepository;
  // let allSubscribers: Subscriber[];
  // let allLabels: Label[];
  // let labelsWithUsers: LabelFull[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [
        rootMongooseTestModule(async () => {
          await installContextVarFixtures();
          await installConversationTypeFixtures();
        }),
      ],
      providers: [
        ConversationService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [conversationService, subscriberService] = await getMocks([
      ConversationService,
      SubscriberService,
    ]);
    // allSubscribers = await subscriberRepository.findAll();
    // allLabels = await labelRepository.findAll();
    // labelsWithUsers = allLabels.map((label) => ({
    //   ...label,
    //   users: allSubscribers,
    // }));
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('ConversationService.storeContextData', () => {
    it('should enrich the conversation context and persist conversation + subscriber (permanent)', async () => {
      const subscriber = (await subscriberService.findOne({
        foreign_id: 'foreign-id-messenger',
      }))!;
      const conversation = (await conversationService.findOne({
        sender: subscriber.id,
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
        conversation!,
        next,
        event,
        true,
      );

      // ---- Assertions ------------------------------------------------------
      expect(result.context.channel).toBe('messenger-channel');
      expect(result.context.text).toBe(mockPhone);
      expect(result.context.vars.phone).toBe(mockPhone);
      expect(result.context.user).toEqual({
        id: subscriber.id,
        first_name: subscriber.first_name,
        last_name: subscriber.last_name,
        language: subscriber.language,
      });

      const updatedSubscriber = (await subscriberService.findOne({
        foreign_id: 'foreign-id-messenger',
      }))!;

      expect(updatedSubscriber.context.vars?.phone).toBe(mockPhone);

      // expect(event.setSender).toHaveBeenCalledWith(updatedSubscriber);
    });

    it('should capture an NLP entity value into context vars (non-permanent)', async () => {
      const subscriber = (await subscriberService.findOne({
        foreign_id: 'foreign-id-messenger',
      }))!;
      const conversation = (await conversationService.findOne({
        sender: subscriber.id,
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
        foreign_id: 'foreign-id-messenger',
      }))!;
      expect(updatedSubscriber.context.vars?.country).toBe(undefined);
    });

    it('should capture user coordinates when message type is "location"', async () => {
      const subscriber = (await subscriberService.findOne({
        foreign_id: 'foreign-id-messenger',
      }))!;
      const conversation = (await conversationService.findOne({
        sender: subscriber.id,
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
        foreign_id: 'foreign-id-messenger',
      }))!;
      const conversation = (await conversationService.findOne({
        sender: subscriber.id,
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

      // Second call to ensure the offset keeps growing
      const result2 = await conversationService.storeContextData(
        conversation,
        next,
        event2,
      );

      expect(result2.context.skip['block-1']).toBe(10);
    });
  });
});
