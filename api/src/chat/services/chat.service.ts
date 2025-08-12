/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';

import { BotStatsType } from '@/analytics/schemas/bot-stats.schema';
import EventWrapper from '@/channel/lib/EventWrapper';
import { config } from '@/config';
import { HelperService } from '@/helper/helper.service';
import { HelperType } from '@/helper/types';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { MessageCreateDto } from '../dto/message.dto';
import { Conversation } from '../schemas/conversation.schema';
import { SubscriberDocument } from '../schemas/subscriber.schema';
import { OutgoingMessage } from '../schemas/types/message';

import { BotService } from './bot.service';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';
import { SubscriberService } from './subscriber.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
    private readonly subscriberService: SubscriberService,
    private readonly botService: BotService,
    private readonly websocketGateway: WebsocketGateway,
    private readonly helperService: HelperService,
    private readonly languageService: LanguageService,
  ) {}

  /**
   * Ends a given conversation (sets active to false)
   *
   * @param convo - The conversation to end
   */
  @OnEvent('hook:conversation:end')
  async handleEndConversation(convo: Conversation) {
    try {
      await this.conversationService.end(convo);
      this.logger.debug('Conversation has ended successfully.', convo.id);
    } catch (err) {
      this.logger.error('Unable to end conversation !', convo.id);
    }
  }

  /**
   * Ends a given conversation (sets active to false)
   *
   * @param convoId - The conversation ID
   */
  @OnEvent('hook:conversation:close')
  async handleCloseConversation(convoId: string) {
    try {
      await this.conversationService.deleteOne(convoId);
      this.logger.debug('Conversation is closed successfully.', convoId);
    } catch (err) {
      this.logger.error('Unable to close conversation.', err);
    }
  }

  /**
   * Finds or creates a message and broadcast it to the websocket "Message" room
   *
   * @param sentMessage - The message that has been sent
   */
  @OnEvent('hook:chatbot:sent', { promisify: true })
  async handleSentMessage(sentMessage: MessageCreateDto) {
    if (sentMessage.mid) {
      try {
        const message = await this.messageService.findOneOrCreate(
          {
            mid: sentMessage.mid,
          },
          sentMessage,
        );
        this.websocketGateway.broadcastMessageSent(message as OutgoingMessage);
        this.logger.debug('Message has been logged.', sentMessage.mid);
      } catch (err) {
        this.logger.error('Unable to log sent message.', err);
      }
    }
  }

  /**
   * Creates the received message and broadcast it to the websocket "Message" room
   *
   * @param event - The received event
   */
  @OnEvent('hook:chatbot:received')
  async handleReceivedMessage(event: EventWrapper<any, any>) {
    let messageId = '';
    this.logger.debug('Received message', event);
    try {
      messageId = event.getId();
    } catch (err) {
      this.logger.warn('Failed to get the event id', messageId);
    }
    const subscriber = event.getSender();
    const received: MessageCreateDto = {
      mid: messageId,
      sender: subscriber.id,
      message: event.getMessage(),
      delivery: true,
      read: true,
    };
    this.logger.debug('Logging message', received);
    try {
      const msg = await this.messageService.create(received);
      const populatedMsg = await this.messageService.findOneAndPopulate(msg.id);

      if (!populatedMsg) {
        this.logger.warn('Unable to find populated message.', event);
        throw new Error(`Unable to find Message by ID ${msg.id} not found`);
      }

      this.websocketGateway.broadcastMessageReceived(populatedMsg, subscriber);
      this.eventEmitter.emit(
        'hook:stats:entry',
        BotStatsType.incoming,
        'Incoming',
      );
      this.eventEmitter.emit(
        'hook:stats:entry',
        BotStatsType.all_messages,
        'All Messages',
      );
    } catch (err) {
      this.logger.error('Unable to log received message.', err, event);
    }
  }

  /**
   * Marks messages as delivered and broadcast it to the websocket "Message" room
   *
   * @param event - The received event
   */
  @OnEvent('hook:chatbot:delivery')
  async handleMessageDelivery(event: EventWrapper<any, any>) {
    if (config.chatbot.messages.track_delivery) {
      const subscriber = event.getSender();
      const deliveredMessages = event.getDeliveredMessages();
      try {
        await this.messageService.updateMany(
          { mid: { $in: deliveredMessages } },
          { delivery: true },
        );
        this.websocketGateway.broadcastMessageDelivered(
          deliveredMessages,
          subscriber,
        );
      } catch (err) {
        this.logger.error('Unable to mark message as delivered.', err);
      }
    }
  }

  /**
   * Mark messages as read and broadcast to websocket "Message" room
   *
   * @param event - The received event
   */
  @OnEvent('hook:chatbot:read')
  async handleMessageRead(event: EventWrapper<any, any>) {
    if (config.chatbot.messages.track_read) {
      const subscriber = event.getSender();
      const watermark = new Date(event.getWatermark());
      const start = new Date(watermark.getTime() - 24 * 3600 * 1000);

      try {
        await this.messageService.updateMany(
          {
            // @ts-expect-error Invesstigate why this is causing a ts error
            recipient: subscriber.id,
            createdAt: { $lte: watermark, $gte: start },
          },
          {
            delivery: true,
            read: true,
          },
        );
        this.websocketGateway.broadcastMessageRead(
          watermark.getTime(),
          subscriber,
        );
      } catch (err) {
        this.logger.error('Unable to mark message as read.', err);
      }
    }
  }

  /**
   * Handle echoing messages
   *
   * @param event - The received event
   */
  @OnEvent('hook:chatbot:echo')
  async handleEchoMessage(event: EventWrapper<any, any>) {
    this.logger.verbose('Message echo received', event._adapter.raw);
    const foreignId = event.getRecipientForeignId();

    if (foreignId) {
      try {
        const recipient = await this.subscriberService.findOne({
          foreign_id: foreignId,
        });

        if (!recipient) {
          throw new Error(`Subscriber with foreign ID ${foreignId} not found`);
        }

        const sentMessage: MessageCreateDto = {
          mid: event.getId(),
          recipient: recipient.id,
          message: event.getMessage(),
          delivery: true,
          read: false,
        };

        this.eventEmitter.emit('hook:chatbot:sent', sentMessage);
        this.eventEmitter.emit('hook:stats:entry', 'echo', 'Echo');
      } catch (err) {
        this.logger.error('Unable to log echo message', err, event);
      }
    }
  }

  /**
   * Handle new incoming messages
   *
   * @param event - The received event
   */
  @OnEvent('hook:chatbot:message')
  async handleNewMessage(event: EventWrapper<any, any>) {
    this.logger.debug('New message received', event._adapter.raw);

    const foreignId = event.getSenderForeignId();
    const handler = event.getHandler();

    try {
      let subscriber = await this.subscriberService.findOne({
        foreign_id: foreignId,
      });

      if (!subscriber) {
        const subscriberData = await handler.getSubscriberData(event);
        subscriberData.channel = event.getChannelData();
        subscriber = await this.subscriberService.create(subscriberData);

        if (!subscriber) {
          throw new Error('Unable to create a new subscriber');
        }

        // Retrieve and store the subscriber avatar
        // @TODO: We need to handle the avatar update (based on the lastvisit?)
        if (handler.getSubscriberAvatar) {
          try {
            const file = await handler.getSubscriberAvatar(event);
            if (file) {
              subscriber = await this.subscriberService.storeAvatar(
                subscriber.id,
                file,
              );
            }
          } catch (err) {
            this.logger.error(
              `Unable to retrieve avatar for subscriber ${event.getSenderForeignId()}`,
              err,
            );
          }
        }
      }
      event.setSender(subscriber);
      // Exec lastvisit hook
      this.eventEmitter.emit('hook:user:lastvisit', subscriber);

      this.websocketGateway.broadcastSubscriberUpdate(subscriber);

      // Set the subscriber object
      event.setSender(subscriber!);

      // Preprocess the event (persist attachments, ...)
      if (event.preprocess) {
        await event.preprocess();
      }

      await this.enrichEventWithNLU(event);

      // Trigger message received event
      this.eventEmitter.emit('hook:chatbot:received', event);

      if (subscriber?.assignedTo) {
        this.logger.debug('Conversation taken over', subscriber.assignedTo);
        return;
      }

      this.botService.handleMessageEvent(event);
    } catch (err) {
      this.logger.error('Error handling new message', err);
    }
  }

  /**
   * Enriches an incoming event by performing NLP inference and updating the sender's language profile if detected.
   *
   * @param event - The incoming event object containing user input and metadata.
   * @returns Resolves when preprocessing is complete. Any errors are logged without throwing.
   */
  async enrichEventWithNLU(event: EventWrapper<any, any>) {
    if (!event.getText() || event.getNLP()) {
      return;
    }

    try {
      const helper = await this.helperService.getDefaultHelper(HelperType.NLU);
      const nlp = await helper.predict(event.getText(), true);

      // Check & catch user language through NLP
      if (nlp) {
        const languages = await this.languageService.getLanguages();
        const spokenLanguage = nlp.entities.find(
          (e) => e.entity === 'language',
        );
        if (spokenLanguage && spokenLanguage.value in languages) {
          const profile = event.getSender();
          profile.language = spokenLanguage.value;
          event.setSender(profile);
        }
      }

      event.setNLP(nlp);
    } catch (err) {
      this.logger.error('Unable to perform NLP parse', err);
    }
  }

  /**
   * Handle new subscriber and send notification the websocket
   *
   * @param subscriber - The end user (subscriber)
   */
  @OnEvent('hook:subscriber:postCreate')
  async onSubscriberCreate({ _id }: SubscriberDocument) {
    const subscriber = await this.subscriberService.findOne(_id);
    if (subscriber) {
      this.websocketGateway.broadcastSubscriberNew(subscriber);
    }
  }

  /**
   * Handle updated subscriber and send notification the websocket
   *
   * @param subscriber - The end user (subscriber)
   */
  @OnEvent('hook:subscriber:postUpdate')
  async onSubscriberUpdate({ _id }: SubscriberDocument) {
    const subscriber = await this.subscriberService.findOne(_id);
    if (subscriber) {
      this.websocketGateway.broadcastSubscriberUpdate(subscriber);
    }
  }
}
