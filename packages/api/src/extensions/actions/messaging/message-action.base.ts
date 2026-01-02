/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionMetadata, SettingsSchema } from '@hexabot-ai/agentic';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { BaseAction } from '@/actions/base-action';
import { BotStatsType } from '@/analytics/entities/bot-stats.entity';
import ConversationalEventWrapper from '@/channel/lib/ConversationalEventWrapper';
import { MessageCreateDto } from '@/chat/dto/message.dto';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { EnvelopeFactory } from '@/chat/helpers/envelope-factory';
import { ChatContext } from '@/chat/types/chat-context';
import {
  StdIncomingMessage,
  stdIncomingMessageSchema,
  StdOutgoingMessage,
  StdOutgoingMessageEnvelope,
  StdOutgoingMessageSchema,
} from '@/chat/types/message';
import { getDefaultChatContext } from '@/workflow/defaults/default-chat-context';
import { WorkflowContext } from '@/workflow/services/workflow-context';

const sentFormats = [
  'text',
  'quickReplies',
  'buttons',
  'list',
  'carousel',
  'attachment',
] as const;

export const sentMessageSchema = z.object({
  mid: z.string().optional(),
  channel: z.string(),
  format: z.enum(sentFormats),
  envelope: StdOutgoingMessageSchema,
});

type SentMessageFormat = (typeof sentFormats)[number];

export type SentMessageInfo = {
  mid?: string;
  channel: string;
  format: SentMessageFormat;
  envelope: StdOutgoingMessage;
};

export type MessageActionOutput = {
  sent: SentMessageInfo;
  reply?: StdIncomingMessage;
};

export const messageActionOutputSchema = z.object({
  sent: sentMessageSchema,
  reply: stdIncomingMessageSchema.optional(),
});

interface PreparedMessageContext {
  event: ConversationalEventWrapper<any, any>;
  recipient: Subscriber;
  envelopeFactory: EnvelopeFactory;
  chatContext: ChatContext;
}

export const messageActionSettingsSchema = SettingsSchema.extend({
  typing: z.union([z.boolean(), z.number().int().nonnegative()]).optional(),
});

export type MessageActionSettings = z.infer<typeof messageActionSettingsSchema>;

export abstract class MessageAction<
  I,
  S extends MessageActionSettings = MessageActionSettings,
> extends BaseAction<I, MessageActionOutput, WorkflowContext, S> {
  protected constructor(
    metadata: ActionMetadata<I, MessageActionOutput, S>,
    actionService: ActionService,
  ) {
    super(metadata, actionService);
  }

  private ensureEvent(context: WorkflowContext) {
    if (!context.event) {
      throw new Error('Missing event on workflow context');
    }

    return context.event;
  }

  private buildChatContext(
    event: ConversationalEventWrapper<any, any>,
    chatContext?: ChatContext,
  ) {
    const defaults = getDefaultChatContext();
    const base = chatContext ?? defaults;
    const sender = event.getInitiator();
    const mergedUser = {
      ...defaults.user,
      ...(base.user ?? {}),
      ...(sender ?? {}),
    } as Subscriber;
    const mergedVars = {
      ...defaults.vars,
      ...(base.vars ?? {}),
      ...(sender?.context?.vars ?? {}),
    };

    return {
      ...defaults,
      ...base,
      vars: mergedVars,
      skip: { ...defaults.skip, ...(base.skip ?? {}) },
      user_location: {
        ...defaults.user_location,
        ...(base.user_location ?? {}),
      },
      attempt: base.attempt ?? defaults.attempt,
      user: mergedUser,
      channel: base.channel ?? event.getHandler().getName(),
    } satisfies ChatContext;
  }

  protected async prepare(
    context: WorkflowContext,
  ): Promise<PreparedMessageContext> {
    const event = this.ensureEvent(context);
    const recipient = event.getInitiator();

    if (!recipient) {
      throw new Error('Missing recipient on event');
    }

    const chatContext = this.buildChatContext(event, context.chatContext);
    const { settings: settingService, i18n } = context.services;
    const settings = await settingService.getSettings();
    const envelopeFactory = new EnvelopeFactory(chatContext, settings, i18n);

    return {
      event,
      recipient,
      envelopeFactory,
      chatContext,
    };
  }

  protected async sendPreparedMessage(
    workflowContext: WorkflowContext,
    prepared: PreparedMessageContext,
    envelope: StdOutgoingMessageEnvelope,
    settings: S,
  ): Promise<MessageActionOutput> {
    const { event, recipient, chatContext } = prepared;
    const eventEmitter = workflowContext.eventEmitter!;
    const { logger } = workflowContext.services;
    const options = this.resolveMessageOptions(settings);
    const sendOptions = options ?? {};

    logger.debug('Sending action message ... ', event.getSenderForeignId());
    const response = await event
      .getHandler()
      .sendMessage(event, envelope, sendOptions, chatContext);

    eventEmitter.emit('hook:stats:entry', BotStatsType.outgoing, 'Outgoing');
    eventEmitter.emit(
      'hook:stats:entry',
      BotStatsType.all_messages,
      'All Messages',
    );

    const mid = response && 'mid' in response ? response.mid : undefined;
    const sent: SentMessageInfo = {
      mid,
      channel: event.getHandler().getName(),
      format: envelope.format,
      envelope: envelope.message,
    };
    const sentMessage: MessageCreateDto = {
      mid: mid ?? '',
      message: envelope.message,
      recipient: recipient.id,
      handover: false,
      read: false,
      delivery: false,
    };
    await eventEmitter.emitAsync('hook:chatbot:sent', sentMessage, event);

    return { sent };
  }

  protected async prepareAndSendMessage(
    workflowContext: WorkflowContext,
    envelope: StdOutgoingMessageEnvelope,
    settings: S,
  ): Promise<MessageActionOutput> {
    const prepared = await this.prepare(workflowContext);

    return this.sendPreparedMessage(
      workflowContext,
      prepared,
      envelope,
      settings,
    );
  }

  protected resolveMessageOptions(
    settings: S,
  ): Record<string, any> | undefined {
    if (settings.typing === undefined) {
      return undefined;
    }

    return { typing: settings.typing };
  }
}
