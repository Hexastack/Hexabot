/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import EventWrapper from '@/channel/lib/EventWrapper';
import { ChannelName } from '@/channel/types';
import { ContentService } from '@/cms/services/content.service';
import { CONSOLE_CHANNEL_NAME } from '@/extensions/channels/console/settings';
import { NLU } from '@/helper/types';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { PluginService } from '@/plugins/plugins.service';
import { PluginType } from '@/plugins/types';
import { SettingService } from '@/setting/services/setting.service';
import { BaseService } from '@/utils/generics/base-service';
import { getRandomElement } from '@/utils/helpers/safeRandom';

import { BlockDto } from '../dto/block.dto';
import { EnvelopeFactory } from '../helpers/envelope-factory';
import { BlockRepository } from '../repositories/block.repository';
import { Block, BlockFull, BlockPopulate } from '../schemas/block.schema';
import { Label } from '../schemas/label.schema';
import { Subscriber } from '../schemas/subscriber.schema';
import { Context } from '../schemas/types/context';
import {
  BlockMessage,
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingSystemEnvelope,
} from '../schemas/types/message';
import { NlpPattern, PayloadPattern } from '../schemas/types/pattern';
import { Payload, StdQuickReply } from '../schemas/types/quick-reply';
import { SubscriberContext } from '../schemas/types/subscriberContext';

@Injectable()
export class BlockService extends BaseService<
  Block,
  BlockPopulate,
  BlockFull,
  BlockDto
> {
  constructor(
    readonly repository: BlockRepository,
    private readonly contentService: ContentService,
    private readonly settingService: SettingService,
    private readonly pluginService: PluginService,
    protected readonly i18n: I18nService,
    protected readonly languageService: LanguageService,
  ) {
    super(repository);
  }

  /**
   * Filters an array of blocks based on the specified channel.
   *
   * This function ensures that only blocks that are either:
   * - Not restricted to specific trigger channels (`trigger_channels` is undefined or empty), or
   * - Explicitly allow the given channel (or the console channel)
   *
   * are included in the returned array.
   *
   * @param blocks - The list of blocks to be filtered.
   * @param channel - The name of the channel to filter blocks by.
   *
   * @returns The filtered array of blocks that are allowed for the given channel.
   */
  filterBlocksByChannel<B extends Block | BlockFull>(
    blocks: B[],
    channel: ChannelName,
  ) {
    return blocks.filter((b) => {
      return (
        !b.trigger_channels ||
        b.trigger_channels.length === 0 ||
        [...b.trigger_channels, CONSOLE_CHANNEL_NAME].includes(channel)
      );
    });
  }

  /**
   * Filters an array of blocks based on subscriber labels.
   *
   * This function selects blocks that either:
   * - Have no trigger labels (making them applicable to all subscribers), or
   * - Contain at least one trigger label that matches a label from the provided list.
   *
   * The filtered blocks are then **sorted** in descending order by the number of trigger labels,
   * ensuring that blocks with more specific targeting (more trigger labels) are prioritized.
   *
   * @param blocks - The list of blocks to be filtered.
   * @param labels - The list of subscriber labels to match against.
   * @returns The filtered and sorted list of blocks.
   */
  filterBlocksBySubscriberLabels<B extends Block | BlockFull>(
    blocks: B[],
    profile?: Subscriber,
  ) {
    if (!profile) {
      return blocks;
    }

    return (
      blocks
        .filter((b) => {
          const triggerLabels = b.trigger_labels.map((l) =>
            typeof l === 'string' ? l : l.id,
          );
          return (
            triggerLabels.length === 0 ||
            triggerLabels.some((l) => profile.labels.includes(l))
          );
        })
        // Priority goes to block who target users with labels
        .sort((a, b) => b.trigger_labels.length - a.trigger_labels.length)
    );
  }

  /**
   * Find a block whose patterns matches the received event
   *
   * @param filteredBlocks blocks Starting/Next blocks in the conversation flow
   * @param event Received channel's message
   *
   * @returns The block that matches
   */
  async match(
    blocks: BlockFull[],
    event: EventWrapper<any, any>,
  ): Promise<BlockFull | undefined> {
    if (!blocks.length) {
      return undefined;
    }

    // Search for block matching a given event
    let block: BlockFull | undefined = undefined;
    const payload = event.getPayload();

    // Perform a filter to get the candidates blocks
    const filteredBlocks = this.filterBlocksBySubscriberLabels(
      this.filterBlocksByChannel(blocks, event.getHandler().getName()),
      event.getSender(),
    );

    // Perform a payload match & pick last createdAt
    if (payload) {
      block = filteredBlocks
        .filter((b) => {
          return this.matchPayload(payload, b);
        })
        .shift();
    }

    if (!block) {
      // Perform a text match (Text or Quick reply)
      const text = event.getText().trim();

      // Check & catch user language through NLP
      const nlp = event.getNLP();
      if (nlp) {
        const languages = await this.languageService.getLanguages();
        const lang = nlp.entities.find((e) => e.entity === 'language');
        if (lang && Object.keys(languages).indexOf(lang.value) !== -1) {
          const profile = event.getSender();
          profile.language = lang.value;
          event.setSender(profile);
        }
      }

      // Perform a text pattern match
      block = filteredBlocks
        .filter((b) => {
          return this.matchText(text, b);
        })
        .shift();

      // Perform an NLP Match
      if (!block && nlp) {
        // Find block pattern having the best match of nlp entities
        let nlpBest = 0;
        filteredBlocks.forEach((b, index, self) => {
          const nlpPattern = this.matchNLP(nlp, b);
          if (nlpPattern && nlpPattern.length > nlpBest) {
            nlpBest = nlpPattern.length;
            block = self[index];
          }
        });
      }
    }
    // Uknown event type => return false;
    // this.logger.error('Unable to recognize event type while matching', event);
    return block;
  }

  /**
   * Performs a payload pattern match for the provided block
   *
   * @param payload - The payload
   * @param block - The block
   *
   * @returns The payload pattern if there's a match
   */
  matchPayload(
    payload: string | Payload,
    block: BlockFull | Block,
  ): PayloadPattern | undefined {
    const payloadPatterns = block.patterns?.filter(
      (p) => typeof p === 'object' && 'label' in p,
    ) as PayloadPattern[];

    return payloadPatterns.find((pt: PayloadPattern) => {
      // Either button postback payload Or content payload (ex. BTN_TITLE:CONTENT_PAYLOAD)
      return (
        (typeof payload === 'string' &&
          pt.value &&
          (pt.value === payload || payload.startsWith(pt.value + ':'))) ||
        // Or attachment postback (ex. Like location quick reply for example)
        (typeof payload === 'object' && pt.type && pt.type === payload.type)
      );
    });
  }

  /**
   * Checks if the block has matching text/regex patterns
   *
   * @param text - The received text message
   * @param block - The block to check against
   *
   * @returns False if no match, string/regex capture else
   */
  matchText(
    text: string,
    block: Block | BlockFull,
  ): (RegExpMatchArray | string)[] | false {
    // Filter text patterns & Instanciate Regex patterns
    const patterns = block.patterns?.map((pattern) => {
      if (
        typeof pattern === 'string' &&
        pattern.endsWith('/') &&
        pattern.startsWith('/')
      ) {
        return new RegExp(pattern.slice(1, -1), 'i');
      }
      return pattern;
    });

    if (patterns?.length)
      // Return first match
      for (let i = 0; i < patterns.length; i++) {
        const pattern = patterns[i];
        if (pattern instanceof RegExp) {
          if (pattern.test(text)) {
            const matches = text.match(pattern);
            if (matches) {
              if (matches.length >= 2) {
                // Remove global match if needed
                matches.shift();
              }
              return matches;
            }
          }
          continue;
        } else if (
          typeof pattern === 'object' &&
          'label' in pattern &&
          text.trim().toLowerCase() === pattern.label.toLowerCase()
        ) {
          // Payload (quick reply)
          return [text];
        } else if (
          typeof pattern === 'string' &&
          text.trim().toLowerCase() === pattern.toLowerCase()
        ) {
          // Equals
          return [text];
        }
        // @deprecated
        //  else if (
        //   typeof pattern === 'string' &&
        //   Soundex(text) === Soundex(pattern)
        // ) {
        //   // Sound like
        //   return [text];
        // }
      }
    // No match
    return false;
  }

  /**
   * Performs an NLP pattern match based on the best guessed entities and/or values
   *
   * @param nlp - Parsed NLP entities
   * @param block - The block to test
   *
   * @returns The NLP patterns that matches
   */
  matchNLP(
    nlp: NLU.ParseEntities,
    block: Block | BlockFull,
  ): NlpPattern[] | undefined {
    // No nlp entities to check against
    if (nlp.entities.length === 0) {
      return undefined;
    }

    const nlpPatterns = block.patterns?.filter((p) => {
      return Array.isArray(p);
    }) as NlpPattern[][];

    // No nlp patterns found
    if (nlpPatterns.length === 0) {
      return undefined;
    }

    // Find NLP pattern match based on best guessed entities
    return nlpPatterns.find((entities: NlpPattern[]) => {
      return entities.every((ev: NlpPattern) => {
        if (ev.match === 'value') {
          return nlp.entities.find((e) => {
            return e.entity === ev.entity && e.value === ev.value;
          });
        } else if (ev.match === 'entity') {
          return nlp.entities.find((e) => {
            return e.entity === ev.entity;
          });
        } else {
          this.logger.warn('Unknown NLP match type', ev);
          return false;
        }
      });
    });
  }

  /**
   * Matches an outcome-based block from a list of available blocks
   * based on the outcome of a system message.
   *
   * @param blocks - An array of blocks to search for a matching outcome.
   * @param envelope - The system message envelope containing the outcome to match.
   *
   * @returns - Returns the first matching block if found, otherwise returns `undefined`.
   */
  matchOutcome(
    blocks: Block[],
    event: EventWrapper<any, any>,
    envelope: StdOutgoingSystemEnvelope,
  ) {
    // Perform a filter to get the candidates blocks
    const filteredBlocks = this.filterBlocksBySubscriberLabels(
      this.filterBlocksByChannel(blocks, event.getHandler().getName()),
      event.getSender(),
    );
    return filteredBlocks.find((b) => {
      return b.patterns
        .filter(
          (p) => typeof p === 'object' && 'type' in p && p.type === 'outcome',
        )
        .some((p: PayloadPattern) =>
          ['any', envelope.message.outcome].includes(p.value),
        );
    });
  }

  /**
   * Replaces tokens with their context variables values in the provided text message
   *
   * `You phone number is {{context.vars.phone}}`
   * Becomes
   * `You phone number is 6354-543-534`
   *
   * @param text - Text message
   * @param context - Object holding context variables relative to the conversation (temporary)
   * @param subscriberContext - Object holding context values relative to the subscriber (permanent)
   * @param settings - Settings Object
   *
   * @returns Text message with the tokens being replaced
   */
  processTokenReplacements(
    text: string,
    context: Context,
    subscriberContext: SubscriberContext,
    settings: Settings,
  ): string {
    return EnvelopeFactory.compileHandlebarsTemplate(
      text,
      {
        ...context,
        vars: {
          ...(subscriberContext?.vars || {}),
          ...(context.vars || {}),
        },
      },
      settings,
    );
  }

  /**
   * Translates and replaces tokens with context variables values
   *
   * @deprecated use EnvelopeFactory.processText() instead
   * @param text - Text to process
   * @param context - The context object
   *
   * @returns The text message translated and tokens being replaces with values
   */
  processText(
    text: string,
    context: Context,
    subscriberContext: SubscriberContext,
    settings: Settings,
  ): string {
    const envelopeFactory = new EnvelopeFactory(
      {
        ...context,
        vars: {
          ...context.vars,
          ...subscriberContext.vars,
        },
      },
      settings,
      this.i18n,
    );

    return envelopeFactory.processText(text);
  }

  /**
   * Return a randomly picked item of the array
   *
   * @deprecated use helper getRandomElement() instead
   * @param array - Array of any type
   *
   * @returns A random item from the array
   */
  getRandom<T>(array: T[]): T {
    return getRandomElement(array);
  }

  /**
   * Logs a warning message
   */
  checkDeprecatedAttachmentUrl(block: Block | BlockFull) {
    if (
      block.message &&
      'attachment' in block.message &&
      block.message.attachment.payload &&
      'url' in block.message.attachment.payload
    ) {
      this.logger.error(
        'Attachment Block : `url` payload has been deprecated in favor of `id`',
        block.id,
        block.message,
      );
    }
  }

  /**
   * Processes a block message based on the format.
   *
   * @param block - The block holding the message to process
   * @param context - Context object
   * @param fallback - Whenever to process main message or local fallback message
   * @param conversationId - The conversation ID
   *
   * @returns - Envelope containing message format and content following {format, message} object structure
   */
  async processMessage(
    block: Block | BlockFull,
    context: Context,
    subscriberContext: SubscriberContext,
    fallback = false,
    conversationId?: string,
  ): Promise<StdOutgoingEnvelope> {
    const settings = await this.settingService.getSettings();
    const blockMessage: BlockMessage =
      fallback && block.options?.fallback
        ? [...block.options.fallback.message]
        : Array.isArray(block.message)
          ? [...block.message]
          : { ...block.message };

    if (Array.isArray(blockMessage)) {
      // Text Message
      // Get random message from array
      const text = this.processText(
        getRandomElement(blockMessage),
        context,
        subscriberContext,
        settings,
      );
      const envelope: StdOutgoingEnvelope = {
        format: OutgoingMessageFormat.text,
        message: { text },
      };
      return envelope;
    } else if (blockMessage && 'text' in blockMessage) {
      if (
        'quickReplies' in blockMessage &&
        Array.isArray(blockMessage.quickReplies) &&
        blockMessage.quickReplies.length > 0
      ) {
        const envelope: StdOutgoingEnvelope = {
          format: OutgoingMessageFormat.quickReplies,
          message: {
            text: this.processText(
              blockMessage.text,
              context,
              subscriberContext,
              settings,
            ),
            quickReplies: blockMessage.quickReplies.map((qr: StdQuickReply) => {
              return qr.title
                ? {
                    ...qr,
                    title: this.processText(
                      qr.title,
                      context,
                      subscriberContext,
                      settings,
                    ),
                  }
                : qr;
            }),
          },
        };
        return envelope;
      } else if (
        'buttons' in blockMessage &&
        Array.isArray(blockMessage.buttons) &&
        blockMessage.buttons.length > 0
      ) {
        const envelope: StdOutgoingEnvelope = {
          format: OutgoingMessageFormat.buttons,
          message: {
            text: this.processText(
              blockMessage.text,
              context,
              subscriberContext,
              settings,
            ),
            buttons: blockMessage.buttons.map((btn) => {
              return btn.title
                ? {
                    ...btn,
                    title: this.processText(
                      btn.title,
                      context,
                      subscriberContext,
                      settings,
                    ),
                  }
                : btn;
            }),
          },
        };
        return envelope;
      }
    } else if (blockMessage && 'attachment' in blockMessage) {
      const attachmentPayload = blockMessage.attachment.payload;
      if (!('id' in attachmentPayload)) {
        this.checkDeprecatedAttachmentUrl(block);
        throw new Error(
          'Remote attachments in blocks are no longer supported!',
        );
      }

      const envelope: StdOutgoingEnvelope = {
        format: OutgoingMessageFormat.attachment,
        message: {
          attachment: {
            type: blockMessage.attachment.type,
            payload: blockMessage.attachment.payload,
          },
          quickReplies: blockMessage.quickReplies
            ? [...blockMessage.quickReplies]
            : undefined,
        },
      };
      return envelope;
    } else if (
      blockMessage &&
      'elements' in blockMessage &&
      block.options?.content
    ) {
      const contentBlockOptions = block.options.content;
      // Hadnle pagination for list/carousel
      let skip = 0;
      if (
        contentBlockOptions.display === OutgoingMessageFormat.list ||
        contentBlockOptions.display === OutgoingMessageFormat.carousel
      ) {
        skip =
          context.skip && context.skip[block.id] ? context.skip[block.id] : 0;
      }
      // Populate list with content
      try {
        const results = await this.contentService.getContent(
          contentBlockOptions,
          skip,
        );
        const envelope: StdOutgoingEnvelope = {
          format: contentBlockOptions.display,
          message: {
            ...results,
            options: contentBlockOptions,
          },
        };
        return envelope;
      } catch (err) {
        this.logger.error(
          'Unable to retrieve content for list template process',
          err,
        );
        throw err;
      }
    } else if (blockMessage && 'plugin' in blockMessage) {
      const plugin = this.pluginService.findPlugin(
        PluginType.block,
        blockMessage.plugin,
      );
      // Process custom plugin block
      try {
        const envelope = await plugin?.process(block, context, conversationId);

        if (!envelope) {
          throw new Error('Unable to find envelope');
        }

        return envelope;
      } catch (e) {
        this.logger.error('Plugin was unable to load/process ', e);
        throw new Error(`Unknown plugin - ${JSON.stringify(blockMessage)}`);
      }
    }
    throw new Error('Invalid message format.');
  }

  /**
   * Updates the `trigger_labels` and `assign_labels` fields of a block when a label is deleted.
   *
   *
   * This method removes the deleted label from the `trigger_labels` and `assign_labels` fields of all blocks that have the label.
   *
   * @param label The label that is being deleted.
   */
  @OnEvent('hook:label:delete')
  async handleLabelDelete(labels: Label[]) {
    const blocks = await this.find({
      $or: [
        { trigger_labels: { $in: labels.map((l) => l.id) } },
        { assign_labels: { $in: labels.map((l) => l.id) } },
      ],
    });

    for (const block of blocks) {
      const trigger_labels = block.trigger_labels.filter(
        (labelId) => !labels.find((l) => l.id === labelId),
      );
      const assign_labels = block.assign_labels.filter(
        (labelId) => !labels.find((l) => l.id === labelId),
      );
      await this.updateOne(block.id, { trigger_labels, assign_labels });
    }
  }
}
