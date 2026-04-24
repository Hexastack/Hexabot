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
import { ThreadService } from './thread.service';

describe('ChatService', () => {
  let service: ChatService;
  let eventEmitter: jest.Mocked<Pick<EventEmitter2, 'emit'>>;
  let logger: jest.Mocked<
    Pick<LoggerService, 'debug' | 'warn' | 'error' | 'verbose'>
  >;
  let messageService: jest.Mocked<Partial<MessageService>>;
  let subscriberService: jest.Mocked<
    Pick<SubscriberService, 'findOneByForeignId'>
  >;
  let threadService: jest.Mocked<
    Pick<
      ThreadService,
      | 'resolveInactivityHours'
      | 'resolveThreadForIncoming'
      | 'resolveOrCreateThread'
      | 'buildThreadTitleFromIncomingText'
      | 'setThreadTitleIfMissing'
    >
  >;
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
    messageService = {
      create: jest.fn(),
      findOneAndPopulate: jest.fn(),
    };
    subscriberService = {
      findOneByForeignId: jest.fn(),
    };
    threadService = {
      resolveInactivityHours: jest.fn().mockReturnValue(24),
      resolveThreadForIncoming: jest
        .fn()
        .mockResolvedValue({ id: 'thread-1', title: null }),
      resolveOrCreateThread: jest.fn().mockResolvedValue({ id: 'thread-1' }),
      buildThreadTitleFromIncomingText: jest
        .fn()
        .mockReturnValue('first inbound message'),
      setThreadTitleIfMissing: jest
        .fn()
        .mockResolvedValue({ id: 'thread-1', title: 'first inbound message' }),
    };
    agenticService = {
      handleEvent: jest.fn().mockResolvedValue(undefined),
    };

    service = new ChatService(
      eventEmitter as unknown as EventEmitter2,
      logger as unknown as LoggerService,
      messageService as MessageService,
      subscriberService as unknown as SubscriberService,
      threadService as unknown as ThreadService,
      agenticService as unknown as AgenticService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('resolves thread and forwards new message event to agentic service', async () => {
    const workflowId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const subscriber = { id: 'sub-1', assignedTo: null };
    const handler = {};
    subscriberService.findOneByForeignId.mockResolvedValue(subscriber as any);
    const event = {
      getRaw: jest.fn().mockReturnValue({ type: 'text' }),
      getSenderForeignId: jest.fn().mockReturnValue('foreign-1'),
      getHandler: jest.fn().mockReturnValue(handler),
      getWorkflowId: jest.fn().mockReturnValue(workflowId),
      getThreadId: jest.fn().mockReturnValue(undefined),
      getText: jest.fn().mockReturnValue('first inbound message'),
      setThreadId: jest.fn(),
      setInitiator: jest.fn(),
      preprocess: jest.fn().mockResolvedValue(undefined),
    };

    await service.handleNewMessage(event as any);

    expect(event.getWorkflowId).not.toHaveBeenCalled();
    expect(threadService.resolveThreadForIncoming).toHaveBeenCalledWith({
      subscriberId: subscriber.id,
      explicitThreadId: undefined,
      inactivityHours: 24,
    });
    expect(event.setThreadId).toHaveBeenCalledWith('thread-1');
    expect(threadService.buildThreadTitleFromIncomingText).toHaveBeenCalledWith(
      'first inbound message',
    );
    expect(threadService.setThreadTitleIfMissing).toHaveBeenCalledWith(
      'thread-1',
      'first inbound message',
    );
    expect(agenticService.handleEvent).toHaveBeenCalledWith(event);
  });

  it('stores received inbound message with resolved thread id', async () => {
    const subscriber = { id: 'sub-1', assignedTo: null };
    const event = {
      getId: jest.fn().mockReturnValue('mid-1'),
      getInitiator: jest.fn().mockReturnValue(subscriber),
      getThreadId: jest.fn().mockReturnValue('thread-1'),
      getMessage: jest.fn().mockReturnValue({ text: 'hello' }),
    };
    (messageService.create as jest.Mock).mockResolvedValue({ id: 'msg-1' });
    (messageService.findOneAndPopulate as jest.Mock).mockResolvedValue({
      id: 'msg-1',
    });

    await service.handleReceivedMessage(event as any);

    expect(messageService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mid: 'mid-1',
        sender: subscriber.id,
        thread: 'thread-1',
        message: { text: 'hello' },
        delivery: true,
        read: true,
      }),
    );
  });

  it('does not override existing thread title', async () => {
    const subscriber = { id: 'sub-1', assignedTo: null };
    const handler = {};
    threadService.resolveThreadForIncoming.mockResolvedValue({
      id: 'thread-1',
      title: 'already set',
    } as any);

    const event = {
      getRaw: jest.fn().mockReturnValue({ type: 'text' }),
      getSenderForeignId: jest.fn().mockReturnValue('foreign-1'),
      getHandler: jest.fn().mockReturnValue(handler),
      getThreadId: jest.fn().mockReturnValue(undefined),
      getText: jest.fn().mockReturnValue('first inbound message'),
      setThreadId: jest.fn(),
      setInitiator: jest.fn(),
      preprocess: jest.fn().mockResolvedValue(undefined),
    };
    subscriberService.findOneByForeignId.mockResolvedValue(subscriber as any);

    await service.handleNewMessage(event as any);

    expect(
      threadService.buildThreadTitleFromIncomingText,
    ).not.toHaveBeenCalled();
    expect(threadService.setThreadTitleIfMissing).not.toHaveBeenCalled();
  });
});
