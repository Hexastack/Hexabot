/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ActionMetadata } from '@hexabot-ai/agentic';

import { ActionService } from '@/actions/actions.service';
import { BaseAction } from '@/actions/base-action';
import { BotStatsType } from '@/analytics/entities/bot-stats.entity';
import EventWrapper from '@/channel/lib/EventWrapper';
import { getDefaultConversationContext } from '@/chat/constants/conversation';
import { MessageCreateDto } from '@/chat/dto/message.dto';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { EnvelopeFactory } from '@/chat/helpers/envelope-factory';
import { Context } from '@/chat/types/context';
import {
  StdIncomingMessage,
  StdOutgoingMessageEnvelope,
} from '@/chat/types/message';
import { WorkflowContext } from '@/workflow/services/workflow-context';

export type MessageActionOutput = StdIncomingMessage;

interface PreparedMessageContext {
  event: EventWrapper<any, any>;
  recipient: Subscriber;
  envelopeFactory: EnvelopeFactory;
  conversationContext: Context;
}

export abstract class MessageAction<I> extends BaseAction<
  I,
  MessageActionOutput,
  WorkflowContext
> {
  protected constructor(
    metadata: ActionMetadata<I, MessageActionOutput>,
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

  private buildConversationContext(
    event: EventWrapper<any, any>,
    conversationContext?: Context,
  ) {
    const defaults = getDefaultConversationContext();
    const base = conversationContext ?? defaults;
    const sender = event.getSender();
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
    } satisfies Context;
  }

  protected async prepare(
    context: WorkflowContext,
  ): Promise<PreparedMessageContext> {
    const event = this.ensureEvent(context);
    const recipient = event.getSender();

    if (!recipient) {
      throw new Error('Missing recipient on event');
    }

    const conversationContext = this.buildConversationContext(
      event,
      context.conversationContext,
    );
    const { settings: settingService, i18n } = context.services;
    const settings = await settingService.getSettings();
    const envelopeFactory = new EnvelopeFactory(
      conversationContext,
      settings,
      i18n,
    );

    return {
      event,
      recipient,
      envelopeFactory,
      conversationContext,
    };
  }

  protected async sendPreparedAndSuspend(
    workflowContext: WorkflowContext,
    prepared: PreparedMessageContext,
    envelope: StdOutgoingMessageEnvelope,
    options?: any,
  ): Promise<MessageActionOutput> {
    const { event, recipient, conversationContext } = prepared;
    const eventEmitter = workflowContext.eventEmitter!;
    const { logger } = workflowContext.services;

    logger.debug('Sending action message ... ', event.getSenderForeignId());
    const response = await event
      .getHandler()
      .sendMessage(event, envelope, options, conversationContext);

    eventEmitter.emit('hook:stats:entry', BotStatsType.outgoing, 'Outgoing');
    eventEmitter.emit(
      'hook:stats:entry',
      BotStatsType.all_messages,
      'All Messages',
    );

    const mid = response && 'mid' in response ? response.mid : '';
    const sentMessage: MessageCreateDto = {
      mid,
      message: envelope.message,
      recipient: recipient.id,
      handover: false,
      read: false,
      delivery: false,
    };
    await eventEmitter.emitAsync('hook:chatbot:sent', sentMessage, event);

    return workflowContext.workflow.suspend<MessageActionOutput>({
      reason: 'awaiting_user_response',
      data: {
        action: this.getName(),
        channel: event.getHandler().getName(),
        recipient: recipient.id,
        conversationId: workflowContext.conversationId,
        messageId: mid || undefined,
        format: envelope.format,
        envelope: envelope.message,
      },
    });
  }

  protected async sendAndSuspend(
    workflowContext: WorkflowContext,
    envelope: StdOutgoingMessageEnvelope,
    options?: any,
  ): Promise<MessageActionOutput> {
    const prepared = await this.prepare(workflowContext);

    return this.sendPreparedAndSuspend(
      workflowContext,
      prepared,
      envelope,
      options,
    );
  }
}
