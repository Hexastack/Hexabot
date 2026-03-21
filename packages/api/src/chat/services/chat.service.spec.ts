/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';

import { LoggerService } from '@/logger/logger.service';
import { AgenticService } from '@/workflow/services/agentic.service';

import { ChatService } from './chat.service';
import { MessageService } from './message.service';
import { SubscriberService } from './subscriber.service';

describe('ChatService', () => {
  let service: ChatService;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let logger: jest.Mocked<
    Pick<LoggerService, 'debug' | 'warn' | 'error' | 'verbose'>
  >;
  let messageService: jest.Mocked<Partial<MessageService>>;
  let subscriberService: jest.Mocked<Pick<SubscriberService, 'findOne'>>;
  let agenticService: jest.Mocked<Pick<AgenticService, 'handleEvent'>>;

  beforeEach(() => {
    eventEmitter = {
      emit: jest.fn(),
    };
    logger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      verbose: jest.fn(),
    };
    messageService = {};
    subscriberService = {
      findOne: jest.fn(),
    };
    agenticService = {
      handleEvent: jest.fn().mockResolvedValue(undefined),
    };

    service = new ChatService(
      eventEmitter as unknown as EventEmitter2,
      logger as unknown as LoggerService,
      messageService as MessageService,
      subscriberService as unknown as SubscriberService,
      agenticService as unknown as AgenticService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('forwards the event object to agentic service for new messages', async () => {
    const workflowId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const subscriber = { id: 'sub-1', assignedTo: null };
    subscriberService.findOne.mockResolvedValue(subscriber as any);
    const event = {
      _adapter: { raw: { type: 'text' } },
      getSenderForeignId: jest.fn().mockReturnValue('foreign-1'),
      getHandler: jest.fn().mockReturnValue({}),
      getWorkflowId: jest.fn().mockReturnValue(workflowId),
      setInitiator: jest.fn(),
      preprocess: jest.fn().mockResolvedValue(undefined),
    };

    await service.handleNewMessage(event as any);

    expect(event.getWorkflowId).not.toHaveBeenCalled();
    expect(agenticService.handleEvent).toHaveBeenCalledWith(event);
  });
});
