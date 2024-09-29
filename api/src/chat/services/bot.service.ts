/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import EventWrapper from '@/channel/lib/EventWrapper';
import { LoggerService } from '@/logger/logger.service';
import { Settings } from '@/setting/schemas/types';
import { SettingService } from '@/setting/services/setting.service';

import { BlockService } from './block.service';
import { ConversationService } from './conversation.service';
import { SubscriberService } from './subscriber.service';
import { MessageCreateDto } from '../dto/message.dto';
import { BlockFull } from '../schemas/block.schema';
import {
  Conversation,
  ConversationFull,
  getDefaultConversationContext,
} from '../schemas/conversation.schema';
import { Context } from '../schemas/types/context';
import {
  IncomingMessageType,
  StdOutgoingEnvelope,
} from '../schemas/types/message';

@Injectable()
export class BotService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
    private readonly blockService: BlockService,
    private readonly conversationService: ConversationService,
    private readonly subscriberService: SubscriberService,
    private readonly settingService: SettingService,
  ) {}

  /**
   * Sends a processed message to the user based on a specified content block.
   * Replaces tokens within the block with context data, handles fallback scenarios,
   * and assigns relevant labels to the user.
   *
   * @param event - The incoming message or action that triggered the bot's response.
   * @param block - The content block containing the message and options to be sent.
   * @param context - Optional. The conversation context object, containing relevant data for personalization.
   * @param fallback - Optional. Boolean flag indicating if this is a fallback message when no appropriate response was found.
   * @param conversationId - Optional. The conversation ID to link the message to a specific conversation thread.
   *
   * @returns A promise that resolves with the message response, including the message ID.
   */
  async sendMessageToSubscriber(
    event: EventWrapper<any, any>,
    block: BlockFull,
    context?: Context,
    fallback?: boolean,
    conservationId?: string,
  ) {
    context = context || getDefaultConversationContext();
    fallback = typeof fallback !== 'undefined' ? fallback : false;
    const options = block.options;
    this.logger.debug(
      'Bot service : Sending message ... ',
      event.getSenderForeignId(),
    );
    // Process message : Replace tokens with context data and then send the message
    const recipient = event.getSender();
    const envelope: StdOutgoingEnvelope =
      await this.blockService.processMessage(
        block,
        context,
        recipient.context,
        fallback,
        conservationId,
      );
    // Send message through the right channel

    const response = await event
      .getHandler()
      .sendMessage(event, envelope, options, context);

    this.eventEmitter.emit('hook:stats:entry', 'outgoing', 'Outgoing');
    this.eventEmitter.emit('hook:stats:entry', 'all_messages', 'All Messages');

    // Trigger sent message event
    const sentMessage: MessageCreateDto = {
      mid: response && 'mid' in response ? response.mid : '',
      message: envelope.message,
      recipient: recipient.id,
      handover: !!(options && options.assignTo),
      read: false,
      delivery: false,
    };
    this.eventEmitter.emit('hook:chatbot:sent', sentMessage, event);

    // analytics log block or local fallback
    if (fallback) {
      this.eventEmitter.emit(
        'hook:analytics:fallback-local',
        block,
        event,
        context,
      );
    } else {
      this.eventEmitter.emit('hook:analytics:block', block, event, context);
    }

    // Apply updates : Assign block labels to user
    const blockLabels = (block.assign_labels || []).map(({ id }) => id);
    const assignTo = block.options.assignTo || null;
    await this.subscriberService.applyUpdates(
      event.getSender(),
      blockLabels,
      assignTo,
    );

    this.logger.debug('Bot service : Assigned labels ', blockLabels);
    return response;
  }

  /**
   * Finds an appropriate reply block and sends it to the user.
   * If there are additional blocks or attached blocks, it continues the conversation flow.
   * Ends the conversation if no further blocks are available.
   *
   * @param event - The incoming message or action that initiated this response.
   * @param convo - The current conversation context and flow.
   * @param block - The content block to be processed and sent.
   * @param fallback - Boolean indicating if this is a fallback response in case no appropriate reply was found.
   *
   * @returns A promise that continues or ends the conversation based on available blocks.
   */
  async findBlockAndSendReply(
    event: EventWrapper<any, any>,
    convo: Conversation,
    block: BlockFull,
    fallback: boolean,
  ) {
    try {
      await this.sendMessageToSubscriber(
        event,
        block,
        convo.context,
        fallback,
        convo.id,
      );
      if (block.attachedBlock) {
        // Sequential messaging ?
        try {
          const attachedBlock = await this.blockService.findOneAndPopulate(
            block.attachedBlock.id,
          );
          if (!attachedBlock) {
            throw new Error(
              'No attached block to be found with id ' + block.attachedBlock,
            );
          }
          return await this.findBlockAndSendReply(
            event,
            convo,
            attachedBlock,
            fallback,
          );
        } catch (err) {
          this.logger.error('Unable to retrieve attached block', err);
          this.eventEmitter.emit('hook:conversation:end', convo, true);
        }
      } else if (
        Array.isArray(block.nextBlocks) &&
        block.nextBlocks.length > 0
      ) {
        // Conversation continues : Go forward to next blocks
        this.logger.debug('Conversation continues ...', convo.id);
        const nextIds = block.nextBlocks.map(({ id }) => id);
        try {
          await this.conversationService.updateOne(convo.id, {
            current: block.id,
            next: nextIds,
          });
        } catch (err) {
          this.logger.error(
            'Unable to update conversation when going next',
            convo,
            err,
          );
          return;
        }
      } else {
        // We need to end the conversation in this case
        this.logger.debug('No attached/next blocks to execute ...');
        this.eventEmitter.emit('hook:conversation:end', convo, false);
      }
    } catch (err) {
      this.logger.error('Unable to process/send message.', err);
      this.eventEmitter.emit('hook:conversation:end', convo, true);
    }
  }

  /**
   * Processes and responds to an incoming message within an ongoing conversation flow.
   * Determines the next block in the conversation, attempts to match the message with available blocks,
   * and handles fallback scenarios if no match is found.
   *
   * @param convo - The current conversation object, representing the flow and context of the dialogue.
   * @param event - The incoming message or action that triggered this response.
   *
   * @returns A promise that resolves with a boolean indicating whether the conversation is active and a matching block was found.
   */
  async handleIncomingMessage(
    convo: ConversationFull,
    event: EventWrapper<any, any>,
  ) {
    const nextIds = convo.next.map(({ id }) => id);
    // Reload blocks in order to populate his nextBlocks
    // nextBlocks & trigger/assign _labels
    try {
      const nextBlocks = await this.blockService.findAndPopulate({
        _id: { $in: nextIds },
      });
      let fallback = false;
      const fallbackOptions =
        convo.current && convo.current.options.fallback
          ? convo.current.options.fallback
          : {
              active: false,
              max_attempts: 0,
            };

      // Find the next block that matches
      const matchedBlock = await this.blockService.match(nextBlocks, event);
      // If there is no match in next block then loopback (current fallback)
      // This applies only to text messages + there's a max attempt to be specified
      let fallbackBlock: BlockFull | undefined;
      if (
        !matchedBlock &&
        event.getMessageType() === IncomingMessageType.message &&
        fallbackOptions.active &&
        convo.context.attempt < fallbackOptions.max_attempts
      ) {
        // Trigger block fallback
        // NOTE : current is not populated, this may cause some anomaly
        const currentBlock = convo.current;
        fallbackBlock = {
          ...currentBlock,
          nextBlocks: convo.next,
          // If there's labels, they should be already have been assigned
          assign_labels: [],
          trigger_labels: [],
          attachedBlock: undefined,
          category: undefined,
          previousBlocks: [],
        };
        convo.context.attempt++;
        fallback = true;
      } else {
        convo.context.attempt = 0;
        fallbackBlock = undefined;
      }

      const next = matchedBlock || fallbackBlock;

      this.logger.debug('Responding ...', convo.id);

      if (next) {
        // Increment stats about popular blocks
        this.eventEmitter.emit('hook:stats:entry', 'popular', next.name);
        // Go next!
        this.logger.debug('Respond to nested conversion! Go next ', next.id);
        try {
          const updatedConversation =
            await this.conversationService.storeContextData(
              convo,
              next,
              event,
              // If this is a local fallback then we don't capture vars
              // Otherwise, old captured const value may be replaced by another const value
              !fallback,
            );
          await this.findBlockAndSendReply(
            event,
            updatedConversation,
            next,
            fallback,
          );
        } catch (err) {
          this.logger.error('Unable to store context data!', err);
          return this.eventEmitter.emit('hook:conversation:end', convo, true);
        }
        return true;
      } else {
        // Conversation is still active, but there's no matching block to call next
        // We'll end the conversation but this message is probably lost in time and space.
        this.logger.debug('No matching block found to call next ', convo.id);
        this.eventEmitter.emit('hook:conversation:end', convo, false);
        return false;
      }
    } catch (err) {
      this.logger.error('Unable to populate the next blocks!', err);
      this.eventEmitter.emit('hook:conversation:end', convo, true);
      throw err;
    }
  }

  /**
   * Determines if the incoming message belongs to an active conversation and processes it accordingly.
   * If an active conversation is found, the message is handled as part of that conversation.
   *
   * @param event - The incoming message or action from the subscriber.
   *
   * @returns A promise that resolves with the conversation's response or false if no active conversation is found.
   */
  async processConversationMessage(event: EventWrapper<any, any>) {
    this.logger.debug(
      'Is this message apart of an active conversation ? Searching ... ',
    );
    const subscriber = event.getSender();
    try {
      const conversation = await this.conversationService.findOneAndPopulate({
        sender: subscriber.id,
        active: true,
      });
      // No active conversation found
      if (!conversation) {
        this.logger.debug('No active conversation found ', subscriber.id);
        return false;
      }

      this.eventEmitter.emit(
        'hook:stats:entry',
        'existing_conversations',
        'Existing conversations',
      );
      this.logger.debug('Conversation has been captured! Responding ...');
      return await this.handleIncomingMessage(conversation, event);
    } catch (err) {
      this.logger.error(
        'An error occured when searching for a conversation ',
        err,
      );
      return null;
    }
  }

  /**
   * Create a new conversation starting from a given block (entrypoint)
   *
   * @param event - Incoming message/action
   * @param block - Starting block
   */
  async startConversation(event: EventWrapper<any, any>, block: BlockFull) {
    // Increment popular stats
    this.eventEmitter.emit('hook:stats:entry', 'popular', block.name);
    // Launching a new conversation
    const subscriber = event.getSender();

    try {
      const convo = await this.conversationService.create({
        sender: subscriber.id,
      });
      this.eventEmitter.emit(
        'hook:stats:entry',
        'new_conversations',
        'New conversations',
      );

      try {
        const updatedConversation =
          await this.conversationService.storeContextData(
            convo,
            block,
            event,
            true,
          );

        this.logger.debug(
          'Bot service : Started a new conversation with ',
          subscriber.id,
          block.name,
        );
        return this.findBlockAndSendReply(
          event,
          updatedConversation,
          block,
          false,
        );
      } catch (err) {
        this.logger.error('Bot service : Unable to store context data!', err);
        this.eventEmitter.emit('hook:conversation:end', convo, true);
      }
    } catch (err) {
      this.logger.error(
        'Botservice : Unable to start a new conversation with ',
        err,
      );
    }
  }

  /**
   * Return global fallback block
   *
   * @param settings - The app settings
   *
   * @returns The global fallback block
   */
  async getGlobalFallbackBlock(settings: Settings) {
    const chatbot_settings = settings.chatbot_settings;
    if (chatbot_settings.fallback_block) {
      const block = await this.blockService.findOneAndPopulate(
        chatbot_settings.fallback_block,
      );

      if (!block) {
        throw new Error('Unable to retrieve global fallback block.');
      }

      return block;
    }
    throw new Error('No global fallback block is defined.');
  }

  /**
   * Processes incoming message event from a given channel
   *
   * @param event - Incoming message/action
   */
  async handleMessageEvent(event: EventWrapper<any, any>) {
    const settings = await this.settingService.getSettings();
    try {
      const captured = await this.processConversationMessage(event);
      if (captured) {
        return;
      }

      // Search for entry blocks
      try {
        const blocks = await this.blockService.findAndPopulate({
          starts_conversation: true,
        });

        if (!blocks.length) {
          return this.logger.debug('No starting message blocks was found');
        }

        // Search for a block match
        const block = await this.blockService.match(blocks, event);

        // No block match
        if (!block) {
          this.logger.debug('No message blocks available!');
          if (
            settings.chatbot_settings &&
            settings.chatbot_settings.global_fallback
          ) {
            this.eventEmitter.emit('hook:analytics:fallback-global', event);
            this.logger.debug('Sending global fallback message ...');
            // If global fallback is defined in a block then launch a new conversation
            // Otherwise, send a simple text message as defined in global settings
            try {
              const fallbackBlock = await this.getGlobalFallbackBlock(settings);
              return this.startConversation(event, fallbackBlock);
            } catch (err) {
              this.logger.warn(
                'No global fallback block defined, sending a message ...',
                err,
              );
              this.sendMessageToSubscriber(event, {
                id: 'global-fallback',
                name: 'Global Fallback',
                message: settings.chatbot_settings.fallback_message,
                options: {},
                patterns: [],
                assign_labels: [],
                starts_conversation: false,
                position: { x: 0, y: 0 },
                capture_vars: [],
                builtin: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                attachedBlock: null,
              } as any as BlockFull);
            }
          }
          // Do nothing ...
          return;
        }

        this.startConversation(event, block);
      } catch (err) {
        this.logger.error(
          'An error occured while retrieving starting message blocks ',
          err,
        );
      }
    } catch (err) {
      this.logger.debug(
        'Either something went wrong, no active conservation was found or user changed subject',
        err,
      );
    }
  }
}
