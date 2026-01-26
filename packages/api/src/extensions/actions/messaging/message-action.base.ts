/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SettingsSchema } from '@hexabot-ai/agentic';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { BaseAction } from '@/actions/base-action';
import { ActionMetadataWithColor } from '@/actions/types';
import { StatsType } from '@/analytics/entities/stats.entity';
import ConversationalEventWrapper from '@/channel/lib/ConversationalEventWrapper';
import { MessageCreateDto } from '@/chat/dto/message.dto';
import { Subscriber } from '@/chat/dto/subscriber.dto';
import { EnvelopeFactory } from '@/chat/helpers/envelope-factory';
import {
  StdIncomingMessage,
  stdIncomingMessageSchema,
  StdOutgoingMessage,
  StdOutgoingMessageEnvelope,
  StdOutgoingMessageSchema,
} from '@/chat/types/message';
import { ConversationalWorkflowContext } from '@/workflow/contexts/conversational-workflow.context';

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
}

export const messageActionSettingsSchema = SettingsSchema.extend({
  typing: z.union([z.boolean(), z.int().nonnegative()]).optional(),
});

export type MessageActionSettings = z.infer<typeof messageActionSettingsSchema>;

export abstract class MessageAction<
  I,
  S extends MessageActionSettings = MessageActionSettings,
> extends BaseAction<I, MessageActionOutput, ConversationalWorkflowContext, S> {
  private static readonly DEFAULT_ICON = 'MessageSquare';

  private static readonly DEFAULT_COLOR = '#e47800';

  private static readonly DEFAULT_GROUP = 'messaging';

  protected constructor(
    metadata: ActionMetadataWithColor<I, MessageActionOutput, S>,
    actionService: ActionService,
  ) {
    super(
      {
        ...metadata,
        icon: metadata.icon ?? MessageAction.DEFAULT_ICON,
        color: metadata.color ?? MessageAction.DEFAULT_COLOR,
        group: metadata.group ?? MessageAction.DEFAULT_GROUP,
      },
      actionService,
    );
  }

  private ensureEvent(context: ConversationalWorkflowContext) {
    if (!context.event) {
      throw new Error('Missing event on workflow context');
    }

    return context.event;
  }

  protected async prepare(
    context: ConversationalWorkflowContext,
  ): Promise<PreparedMessageContext> {
    const event = this.ensureEvent(context);
    const recipient = event.getInitiator();

    if (!recipient) {
      throw new Error('Missing recipient on event');
    }

    const envelopeFactory = new EnvelopeFactory();

    return {
      event,
      recipient,
      envelopeFactory,
    };
  }

  protected async sendPreparedMessage(
    workflowContext: ConversationalWorkflowContext,
    prepared: PreparedMessageContext,
    envelope: StdOutgoingMessageEnvelope,
    settings: S,
  ): Promise<MessageActionOutput> {
    const { event, recipient } = prepared;
    const eventEmitter = workflowContext.eventEmitter!;
    const { logger } = workflowContext.services;
    const options = this.resolveMessageOptions(settings);
    const sendOptions = options ?? {};

    logger.debug('Sending action message ... ', event.getSenderForeignId());
    const response = await event
      .getHandler()
      .sendMessage(event, envelope, sendOptions);

    eventEmitter.emit('hook:stats:entry', StatsType.outgoing, 'Outgoing');
    eventEmitter.emit(
      'hook:stats:entry',
      StatsType.all_messages,
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
    workflowContext: ConversationalWorkflowContext,
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
