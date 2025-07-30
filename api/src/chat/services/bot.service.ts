/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BotStatsType } from '@/analytics/schemas/bot-stats.schema';
import EventWrapper from '@/channel/lib/EventWrapper';
import { HelperService } from '@/helper/helper.service';
import { FlowEscape, HelperType } from '@/helper/types';
import { LoggerService } from '@/logger/logger.service';
import { SettingService } from '@/setting/services/setting.service';

import { getDefaultConversationContext } from '../constants/conversation';
import { MessageCreateDto } from '../dto/message.dto';
import { BlockFull } from '../schemas/block.schema';
import { Conversation, ConversationFull } from '../schemas/conversation.schema';
import { Context } from '../schemas/types/context';
import {
  IncomingMessageType,
  OutgoingMessageFormat,
  StdOutgoingMessageEnvelope,
} from '../schemas/types/message';
import { FallbackOptions } from '../schemas/types/options';

import { BlockService } from './block.service';
import { ConversationService } from './conversation.service';
import { SubscriberService } from './subscriber.service';

@Injectable()
export class BotService {
  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
    private readonly blockService: BlockService,
    private readonly conversationService: ConversationService,
    private readonly subscriberService: SubscriberService,
    private readonly settingService: SettingService,
    private readonly helperService: HelperService,
  ) {}

  /**
   * Sends a message to the subscriber via the appropriate messaging channel and handles related events.
   *
   * @param envelope - The outgoing message envelope containing the bot's response.
   * @param block - The content block containing the message and options to be sent.
   * @param context - Optional. The conversation context object, containing relevant data for personalization.
   * @param fallback - Optional. Boolean flag indicating if this is a fallback message when no appropriate response was found.
   */
  async sendMessageToSubscriber(
    envelope: StdOutgoingMessageEnvelope,
    event: EventWrapper<any, any>,
    block: BlockFull,
    context?: Context,
    fallback?: boolean,
  ) {
    const options = block.options;
    const recipient = event.getSender();
    // Send message through the right channel
    this.logger.debug('Sending message ... ', event.getSenderForeignId());
    const response = await event
      .getHandler()
      .sendMessage(event, envelope, options, context);

    this.eventEmitter.emit(
      'hook:stats:entry',
      BotStatsType.outgoing,
      'Outgoing',
    );
    this.eventEmitter.emit(
      'hook:stats:entry',
      BotStatsType.all_messages,
      'All Messages',
    );

    // Trigger sent message event
    const sentMessage: MessageCreateDto = {
      mid: response && 'mid' in response ? response.mid : '',
      message: envelope.message,
      recipient: recipient.id,
      handover: !!(options && options.assignTo),
      read: false,
      delivery: false,
    };
    await this.eventEmitter.emitAsync('hook:chatbot:sent', sentMessage, event);

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
    const assignTo = block.options?.assignTo || null;

    let subscriber = event.getSender();

    // Apply labels update (no-op if labels is empty)
    if (blockLabels.length > 0) {
      this.logger.debug('Assigning labels ', blockLabels);

      subscriber = await this.subscriberService.assignLabels(
        subscriber,
        blockLabels,
      );
    }

    // 2) Apply handover (no-op if assignTo is null)
    if (assignTo) {
      subscriber = await this.subscriberService.handOver(subscriber, assignTo);
    }

    event.setSender(subscriber);
  }

  /**
   * Processes and executes a block, handling its associated messages and flow logic.
   *
   * The function performs the following steps:
   * 1. Retrieves the conversation context and recipient information.
   * 2. Generates an outgoing message envelope from the block.
   * 3. Sends the message to the subscriber unless it's a system message.
   * 4. Handles block chaining:
   *    - If the block has an attached block, it recursively triggers the attached block.
   *    - If the block has multiple possible next blocks, it determines the next block based on the outcome of the system message.
   *    - If there are next blocks but no outcome-based matching, it updates the conversation state for the next steps.
   * 5. If no further blocks exist, it ends the flow execution.
   *
   * @param event - The incoming message or action that initiated this response.
   * @param convo - The current conversation context and flow.
   * @param block - The content block to be processed and sent.
   * @param fallback - Boolean indicating if this is a fallback response in case no appropriate reply was found.
   *
   * @returns A promise that either continues or ends the flow execution based on the available blocks.
   */
  async triggerBlock(
    event: EventWrapper<any, any>,
    convo: Conversation,
    block: BlockFull,
    fallback: boolean = false,
  ) {
    try {
      const context = convo.context || getDefaultConversationContext();
      const recipient = event.getSender();

      const envelope = await this.blockService.processMessage(
        block,
        context,
        recipient?.context,
        fallback,
        convo.id,
      );

      if (envelope.format !== OutgoingMessageFormat.system) {
        await this.sendMessageToSubscriber(
          envelope,
          event,
          block,
          context,
          fallback,
        );
      }

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
          return await this.triggerBlock(event, convo, attachedBlock, fallback);
        } catch (err) {
          this.logger.error('Unable to retrieve attached block', err);
          this.eventEmitter.emit('hook:conversation:end', convo);
        }
      } else if (
        Array.isArray(block.nextBlocks) &&
        block.nextBlocks.length > 0
      ) {
        try {
          if (envelope.format === OutgoingMessageFormat.system) {
            // System message: Trigger the next block based on the outcome
            this.logger.debug(
              'Matching the outcome against the next blocks ...',
              convo.id,
            );
            const match = this.blockService.matchOutcome(
              block.nextBlocks,
              event,
              envelope,
            );

            if (match) {
              const nextBlock = await this.blockService.findOneAndPopulate(
                match.id,
              );
              if (!nextBlock) {
                throw new Error(
                  'No attached block to be found with id ' +
                    block.attachedBlock,
                );
              }

              await this.conversationService.storeContextData(
                convo,
                nextBlock,
                event,
                false,
              );

              return await this.triggerBlock(event, convo, nextBlock, fallback);
            } else {
              this.logger.warn(
                'Block outcome did not match any of the next blocks',
                convo,
              );
              this.eventEmitter.emit('hook:conversation:end', convo);
            }
          } else {
            // Conversation continues : Go forward to next blocks
            this.logger.debug('Conversation continues ...', convo.id);
            const nextIds = block.nextBlocks.map(({ id }) => id);
            await this.conversationService.updateOne(convo.id, {
              current: block.id,
              next: nextIds,
            });
          }
        } catch (err) {
          this.logger.error('Unable to continue the flow', convo, err);
          return;
        }
      } else {
        // We need to end the conversation in this case
        this.logger.debug('No attached/next blocks to execute ...');
        this.eventEmitter.emit('hook:conversation:end', convo);
      }
    } catch (err) {
      this.logger.error('Unable to process/send message.', err);
      this.eventEmitter.emit('hook:conversation:end', convo);
    }
  }

  /**
   * Handles advancing the conversation to the specified *next* block.
   *
   * @param convo - The current conversation object containing context and state.
   * @param next - The next block to proceed to in the conversation flow.
   * @param event - The incoming event that triggered the conversation flow.
   * @param fallback - Boolean indicating if this is a fallback response in case no appropriate reply was found.
   *
   * @returns A promise that resolves to a boolean indicating whether the next block was successfully triggered.
   */
  async proceedToNextBlock(
    convo: ConversationFull,
    next: BlockFull,
    event: EventWrapper<any, any>,
    fallback: boolean,
  ): Promise<boolean> {
    // Increment stats about popular blocks
    this.eventEmitter.emit('hook:stats:entry', BotStatsType.popular, next.name);
    this.logger.debug(
      `Proceeding to next block ${next.id} for conversation ${convo.id}`,
    );

    try {
      convo.context.attempt = fallback ? convo.context.attempt + 1 : 0;
      const updatedConversation =
        await this.conversationService.storeContextData(
          convo,
          next,
          event,
          // If this is a local fallback then we don’t capture vars.
          !fallback,
        );

      await this.triggerBlock(event, updatedConversation, next, fallback);
      return true;
    } catch (err) {
      this.logger.error('Unable to proceed to the next block!', err);
      this.eventEmitter.emit('hook:conversation:end', convo);
      return false;
    }
  }

  /**
   * Finds the next block that matches the event criteria within the conversation's next blocks.
   *
   * @param convo - The current conversation object containing context and state.
   * @param event - The incoming event that triggered the conversation flow.
   *
   * @returns A promise that resolves with the matched block or undefined if no match is found.
   */
  async findNextMatchingBlock(
    convo: ConversationFull,
    event: EventWrapper<any, any>,
  ): Promise<BlockFull | undefined> {
    const fallbackOptions: FallbackOptions =
      this.blockService.getFallbackOptions(convo.current);
    // We will avoid having multiple matches when we are not at the start of a conversation
    // and only if local fallback is enabled
    const canHaveMultipleMatches = !fallbackOptions?.active;
    // Find the next block that matches
    const nextBlocks = await this.blockService.findAndPopulate({
      _id: { $in: convo.next.map(({ id }) => id) },
    });
    return await this.blockService.match(
      nextBlocks,
      event,
      canHaveMultipleMatches,
    );
  }

  /**
   * Determines if a fallback should be attempted based on the event type, fallback options, and conversation context.
   *
   * @param convo - The current conversation object containing context and state.
   * @param event - The incoming event that triggered the conversation flow.
   *
   * @returns A boolean indicating whether a fallback should be attempted.
   */
  shouldAttemptLocalFallback(
    convo: ConversationFull,
    event: EventWrapper<any, any>,
  ): boolean {
    const fallbackOptions = this.blockService.getFallbackOptions(convo.current);
    const maxAttempts = fallbackOptions?.max_attempts ?? 0;
    return (
      event.getMessageType() === IncomingMessageType.message &&
      !!fallbackOptions?.active &&
      maxAttempts > 0 &&
      convo.context.attempt <= maxAttempts
    );
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
  async handleOngoingConversationMessage(
    convo: ConversationFull,
    event: EventWrapper<any, any>,
  ) {
    try {
      let fallback = false;
      this.logger.debug('Handling ongoing conversation message ...', convo.id);
      const matchedBlock = await this.findNextMatchingBlock(convo, event);
      let fallbackBlock: BlockFull | undefined = undefined;
      if (!matchedBlock && this.shouldAttemptLocalFallback(convo, event)) {
        const fallbackResult = await this.handleFlowEscapeFallback(
          convo,
          event,
        );
        fallbackBlock = fallbackResult.nextBlock;
        fallback = fallbackResult.fallback;
      }

      const next = matchedBlock || fallbackBlock;

      this.logger.debug('Responding ...', convo.id);

      if (next) {
        // Proceed to the execution of the next block
        return await this.proceedToNextBlock(convo, next, event, fallback);
      } else {
        // Conversation is still active, but there's no matching block to call next
        // We'll end the conversation but this message is probably lost in time and space.
        this.logger.debug('No matching block found to call next ', convo.id);
        this.eventEmitter.emit('hook:conversation:end', convo);
        return false;
      }
    } catch (err) {
      this.logger.error('Unable to populate the next blocks!', err);
      this.eventEmitter.emit('hook:conversation:end', convo);
      throw err;
    }
  }

  /**
   * Handles the flow escape fallback logic for a conversation.
   *
   * This method adjudicates the flow escape event and helps determine the next block to execute based on the helper's response.
   * It can coerce the event to a specific next block, create a new context, or reprompt the user with a fallback message.
   * If the helper cannot handle the flow escape, it returns a fallback block with the current conversation's state.
   *
   * @param convo - The current conversation object.
   * @param event - The incoming event that triggered the fallback.
   *
   * @returns An object containing the next block to execute (if any) and a flag indicating if a fallback should occur.
   */
  async handleFlowEscapeFallback(
    convo: ConversationFull,
    event: EventWrapper<any, any>,
  ): Promise<{ nextBlock?: BlockFull; fallback: boolean }> {
    const currentBlock = convo.current;
    const fallbackOptions: FallbackOptions =
      this.blockService.getFallbackOptions(currentBlock);
    const fallbackBlock: BlockFull = {
      ...currentBlock,
      nextBlocks: convo.next,
      assign_labels: [],
      trigger_labels: [],
      attachedBlock: null,
      category: null,
      previousBlocks: [],
    };

    try {
      const helper = await this.helperService.getDefaultHelper(
        HelperType.FLOW_ESCAPE,
      );

      if (!helper.canHandleFlowEscape(currentBlock)) {
        return { nextBlock: fallbackBlock, fallback: true };
      }

      // Adjudicate the flow escape event
      this.logger.debug(
        `Adjudicating flow escape for block '${currentBlock.id}' in conversation '${convo.id}'.`,
      );
      const result = await helper.adjudicate(event, currentBlock);

      switch (result.action) {
        case FlowEscape.Action.COERCE: {
          // Coerce the option to the next block
          this.logger.debug(`Coercing option to the next block ...`, convo.id);
          const proxiedEvent = new Proxy(event, {
            get(target, prop, receiver) {
              if (prop === 'getText') {
                return () => result.coercedOption + '';
              }
              return Reflect.get(target, prop, receiver);
            },
          });
          const matchedBlock = await this.findNextMatchingBlock(
            convo,
            proxiedEvent,
          );
          return { nextBlock: matchedBlock, fallback: false };
        }

        case FlowEscape.Action.NEW_CTX:
          return { nextBlock: undefined, fallback: false };

        case FlowEscape.Action.REPROMPT:
        default:
          if (result.repromptMessage) {
            fallbackBlock.options.fallback = {
              ...fallbackOptions,
              message: [result.repromptMessage],
            };
          }
          return { nextBlock: fallbackBlock, fallback: true };
      }
    } catch (err) {
      this.logger.warn(
        'Unable to handle flow escape, using default local fallback ...',
        err,
      );
      return { nextBlock: fallbackBlock, fallback: true };
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
        BotStatsType.existing_conversations,
        'Existing conversations',
      );
      this.logger.debug('Conversation has been captured! Responding ...');
      return await this.handleOngoingConversationMessage(conversation, event);
    } catch (err) {
      this.logger.error(
        'An error occurred when searching for a conversation ',
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
    this.eventEmitter.emit(
      'hook:stats:entry',
      BotStatsType.popular,
      block.name,
    );
    // Launching a new conversation
    const subscriber = event.getSender();

    try {
      const convo = await this.conversationService.create({
        sender: subscriber.id,
      });
      this.eventEmitter.emit(
        'hook:stats:entry',
        BotStatsType.new_conversations,
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
          'Started a new conversation with ',
          subscriber.id,
          block.name,
        );
        return await this.triggerBlock(
          event,
          updatedConversation,
          block,
          false,
        );
      } catch (err) {
        this.logger.error('Unable to store context data!', err);
        this.eventEmitter.emit('hook:conversation:end', convo);
      }
    } catch (err) {
      this.logger.error('Unable to start a new conversation with ', err);
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
          this.logger.debug('No starting message blocks was found');
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
              const globalFallbackBlock: BlockFull = {
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
                trigger_labels: [],
                nextBlocks: [],
                category: null,
                outcomes: [],
                trigger_channels: [],
              };

              const envelope = await this.blockService.processMessage(
                globalFallbackBlock,
                getDefaultConversationContext(),
                { vars: {} }, // @TODO: use subscriber ctx
              );

              await this.sendMessageToSubscriber(
                envelope as StdOutgoingMessageEnvelope,
                event,
                globalFallbackBlock,
              );
            }
          }
          // Do nothing ...
          return;
        }

        this.startConversation(event, block);
      } catch (err) {
        this.logger.error(
          'An error occurred while retrieving starting message blocks ',
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
