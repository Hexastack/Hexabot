/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { BotStatsType } from '@/analytics/entities/bot-stats.entity';
import EventWrapper from '@/channel/lib/EventWrapper';
import { EnvelopeFactory } from '@/chat/helpers/envelope-factory';
import { Context } from '@/chat/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingMessageEnvelope,
} from '@/chat/types/message';
import { WorkflowContext } from '@/workflow/services/workflow-context';

import {
  MessageAction,
  MessageActionSettings,
  messageActionSettingsSchema,
} from './message-action.base';

class TestMessageAction extends MessageAction<any> {
  constructor(actionService: ActionService) {
    super(
      {
        name: 'test_message_action',
        description: 'test message action',
        inputSchema: z.any(),
        outputSchema: z.any(),
        settingsSchema: messageActionSettingsSchema,
      },
      actionService,
    );
  }

  async execute() {
    return null as any;
  }
}

type MockEvent = jest.Mocked<EventWrapper<any, any>>;

describe('MessageAction base', () => {
  let actionService: ActionService;
  let action: TestMessageAction;
  let settingsService: { getSettings: jest.Mock };
  let i18n: { t: jest.Mock };
  let logger: {
    debug: jest.Mock;
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  };
  let eventEmitter: { emit: jest.Mock; emitAsync: jest.Mock };
  let handler: { getName: jest.Mock; sendMessage: jest.Mock };
  let recipient: any;
  let event: MockEvent;
  let workflow: { suspend: jest.Mock };
  let baseContext: Context;

  const buildWorkflowContext = (
    overrides: Partial<WorkflowContext> = {},
  ): WorkflowContext =>
    ({
      event,
      chatContext: baseContext,
      services: {
        settings: settingsService,
        i18n,
        logger,
      },
      eventEmitter,
      workflow,
      workflowRunId: 'run-123',
      ...overrides,
    }) as unknown as WorkflowContext;

  beforeEach(() => {
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new TestMessageAction(actionService);

    settingsService = {
      getSettings: jest.fn().mockResolvedValue({ contact: {} }),
    };
    i18n = {
      t: jest.fn((_key, opts) => opts?.defaultValue ?? _key),
    };
    logger = {
      debug: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    eventEmitter = {
      emit: jest.fn(),
      emitAsync: jest.fn().mockResolvedValue(undefined),
    };
    handler = {
      getName: jest.fn(() => 'web'),
      sendMessage: jest.fn().mockResolvedValue({ mid: 'server-mid' }),
    };
    recipient = {
      id: 'recipient-id',
      firstName: 'Recipient',
      lastName: 'User',
      language: 'fr',
      context: { vars: { sender: 'value' } },
    };
    event = {
      getSender: jest.fn(() => recipient),
      getSenderForeignId: jest.fn(() => 'foreign-123'),
      getHandler: jest.fn(() => handler as any),
      getMessage: jest.fn(() => ({ text: 'incoming-message' })),
    } as unknown as MockEvent;
    workflow = {
      suspend: jest.fn(),
    };
    baseContext = {
      vars: { fromContext: 'contextVar' },
      user_location: { lat: 12, lon: 42 },
      user: {
        id: 'base-user',
        firstName: 'Base',
        lastName: 'User',
        language: 'en',
        context: { vars: { baseUser: 'foo' } },
      } as any,
      skip: { baseSkip: 1 },
      attempt: 3,
      channel: null,
      text: 'hello',
      payload: null,
      nlp: null,
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('throws when event is missing on the workflow context', async () => {
    const context = buildWorkflowContext({ event: undefined as any });

    await expect((action as any).prepare(context)).rejects.toThrow(
      'Missing event on workflow context',
    );
    expect(settingsService.getSettings).not.toHaveBeenCalled();
  });

  it('throws when recipient is missing on the event', async () => {
    const context = buildWorkflowContext({
      event: {
        ...event,
        getSender: jest.fn(() => undefined),
      } as unknown as MockEvent,
    });

    await expect((action as any).prepare(context)).rejects.toThrow(
      'Missing recipient on event',
    );
  });

  it('builds chat context by merging defaults, provided context, and sender data', async () => {
    const prepared = await (action as any).prepare(buildWorkflowContext());

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(prepared.recipient).toBe(recipient);
    expect(prepared.envelopeFactory).toBeInstanceOf(EnvelopeFactory);
    expect(prepared.chatContext.vars).toEqual({
      fromContext: 'contextVar',
      sender: 'value',
    });
    expect(prepared.chatContext.user).toEqual(
      expect.objectContaining({
        firstName: 'Recipient',
        lastName: 'User',
        language: 'fr',
      }),
    );
    expect(prepared.chatContext.skip).toEqual({ baseSkip: 1 });
    expect(prepared.chatContext.user_location).toEqual({ lat: 12, lon: 42 });
    expect(prepared.chatContext.attempt).toBe(3);
    expect(prepared.chatContext.channel).toBe('web');
    expect(handler.getName).toHaveBeenCalled();
  });

  it('sends the message, emits stats, and returns sent metadata', async () => {
    const context = buildWorkflowContext();
    const prepared = await (action as any).prepare(context);
    const envelope: StdOutgoingMessageEnvelope = {
      format: OutgoingMessageFormat.text,
      message: { text: 'hi' },
    };
    const result = await (action as any).sendPreparedMessage(
      context,
      prepared,
      envelope,
      { typing: 200 } as MessageActionSettings,
    );

    expect(logger.debug).toHaveBeenCalledWith(
      'Sending action message ... ',
      'foreign-123',
    );
    expect(handler.sendMessage).toHaveBeenCalledWith(
      prepared.event,
      envelope,
      { typing: 200 },
      prepared.chatContext,
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'hook:stats:entry',
      BotStatsType.outgoing,
      'Outgoing',
    );
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'hook:stats:entry',
      BotStatsType.all_messages,
      'All Messages',
    );
    expect(eventEmitter.emitAsync).toHaveBeenCalledWith(
      'hook:chatbot:sent',
      {
        mid: 'server-mid',
        message: envelope.message,
        recipient: recipient.id,
        handover: false,
        read: false,
        delivery: false,
      },
      prepared.event,
    );
    expect(result).toEqual({
      sent: {
        mid: 'server-mid',
        channel: 'web',
        format: OutgoingMessageFormat.text,
        envelope: envelope.message,
      },
    });
  });

  it('returns sent metadata when no mid is provided by handler', async () => {
    const context = buildWorkflowContext();
    const prepared = await (action as any).prepare(context);
    const envelope: StdOutgoingMessageEnvelope = {
      format: OutgoingMessageFormat.quickReplies,
      message: { text: 'question', quickReplies: [] },
    };
    handler.sendMessage.mockResolvedValueOnce({});

    const result = await (action as any).sendPreparedMessage(
      context,
      prepared,
      envelope,
      {} as MessageActionSettings,
    );

    expect(handler.sendMessage).toHaveBeenCalledWith(
      prepared.event,
      envelope,
      {},
      prepared.chatContext,
    );
    expect(result).toEqual({
      sent: {
        mid: undefined,
        channel: 'web',
        format: OutgoingMessageFormat.quickReplies,
        envelope: envelope.message,
      },
    });
  });

  it('delegates send flow through prepareAndSendMessage', async () => {
    const context = buildWorkflowContext();
    const envelope: StdOutgoingMessageEnvelope = {
      format: OutgoingMessageFormat.text,
      message: { text: 'hi' },
    };
    const prepared = await (action as any).prepare(context);
    const sendSpy = jest
      .spyOn(action as any, 'sendPreparedMessage')
      .mockResolvedValue('sent');
    const prepareSpy = jest
      .spyOn(action as any, 'prepare')
      .mockResolvedValue(prepared);
    const result = await (action as any).prepareAndSendMessage(
      context,
      envelope,
      {} as MessageActionSettings,
    );

    expect(prepareSpy).toHaveBeenCalledWith(context);
    expect(sendSpy).toHaveBeenCalledWith(
      context,
      prepared,
      envelope,
      {} as MessageActionSettings,
    );
    expect(result).toBe('sent');
  });

  it('returns message options only when typing is provided', () => {
    expect(
      (action as any).resolveMessageOptions({ typing: undefined }),
    ).toBeUndefined();
    expect((action as any).resolveMessageOptions({ typing: false })).toEqual({
      typing: false,
    });
    expect((action as any).resolveMessageOptions({ typing: 3 })).toEqual({
      typing: 3,
    });
  });
});
