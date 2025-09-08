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
import { NLU } from '@/helper/types';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { NlpService } from '@/nlp/services/nlp.service';
import { PluginService } from '@/plugins/plugins.service';
import { PluginType } from '@/plugins/types';
import { SettingService } from '@/setting/services/setting.service';
import { FALLBACK_DEFAULT_NLU_PENALTY_FACTOR } from '@/utils/constants/nlp';
import { BaseService } from '@/utils/generics/base-service';
import { getRandomElement } from '@/utils/helpers/safeRandom';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  DEFAULT_BLOCK_SEARCH_LIMIT,
  getDefaultFallbackOptions,
} from '../constants/block';
import { BlockDto } from '../dto/block.dto';
import { EnvelopeFactory } from '../helpers/envelope-factory';
import { BlockRepository } from '../repositories/block.repository';
import {
  Block,
  BlockFull,
  BlockPopulate,
  BlockStub,
} from '../schemas/block.schema';
import { Label } from '../schemas/label.schema';
import { Subscriber } from '../schemas/subscriber.schema';
import { Context } from '../schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingSystemEnvelope,
} from '../schemas/types/message';
import { FallbackOptions } from '../schemas/types/options';
import { NlpPattern, PayloadPattern } from '../schemas/types/pattern';
import { Payload } from '../schemas/types/quick-reply';
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
    protected readonly nlpService: NlpService,
  ) {
    super(repository);
  }

  /**
   * Full-text search for blocks. Searches for blocks matching the given query string.
   *
   * @param query - The search query to filter blocks.
   * @param limit - The maximum number of results to return. Defaults to 50.
   * @param category - (Optional) The category to filter the search results.
   * @returns A promise that resolves to the search results.
   */
  async search(
    query: string,
    limit = DEFAULT_BLOCK_SEARCH_LIMIT,
    category?: string,
  ) {
    return await this.repository.search(query, limit, category);
  }

  /**
   * Checks if block is supported on the specified channel.
   *
   * @param block - The block
   * @param channel - The name of the channel to filter blocks by.
   *
   * @returns Whether the block is supported on the given channel.
   */
  isChannelSupported<B extends Block | BlockFull>(
    block: B,
    channel: ChannelName,
  ) {
    return (
      !block.trigger_channels ||
      block.trigger_channels.length === 0 ||
      block.trigger_channels.includes(channel)
    );
  }

  /**
   * Checks if the block matches the subscriber labels, allowing for two scenarios:
   * - Has no trigger labels (making it applicable to all subscribers), or
   * - Contains at least one trigger label that matches a label from the provided list.
   *
   * @param block - The block to check.
   * @param labels - The list of subscriber labels to match against.
   * @returns True if the block matches the subscriber labels, false otherwise.
   */
  matchesSubscriberLabels<B extends Block | BlockFull>(
    block: B,
    subscriber?: Subscriber,
  ) {
    if (!subscriber || !subscriber.labels) {
      return true; // No subscriber or labels to match against
    }

    const triggerLabels = block.trigger_labels.map((l: string | Label) =>
      typeof l === 'string' ? l : l.id,
    );
    return (
      triggerLabels.length === 0 ||
      triggerLabels.some((l) => subscriber.labels.includes(l))
    );
  }

  /**
   * Retrieves the configured NLU penalty factor from settings, or falls back to a default value.
   *
   * @returns The NLU penalty factor as a number.
   */
  private async getPenaltyFactor(): Promise<number> {
    const settings = await this.settingService.getSettings();
    const nluPenaltyFactor =
      settings.chatbot_settings?.default_nlu_penalty_factor;

    if (!nluPenaltyFactor) {
      this.logger.warn(
        `The NLU penalty factor has reverted to its default fallback value of: ${FALLBACK_DEFAULT_NLU_PENALTY_FACTOR}`,
      );
    }
    return nluPenaltyFactor ?? FALLBACK_DEFAULT_NLU_PENALTY_FACTOR;
  }

  /**
   * Find a block whose patterns matches the received event
   *
   * @param filteredBlocks blocks Starting/Next blocks in the conversation flow
   * @param event Received channel's message
   * @param canHaveMultipleMatches Whether to allow multiple matches for the same event
   *  (eg. Yes/No question to which the answer is ambiguous "Sometimes yes, sometimes no")
   *
   * @returns The block that matches
   */
  async match(
    blocks: BlockFull[],
    event: EventWrapper<any, any>,
    canHaveMultipleMatches = true,
  ): Promise<BlockFull | undefined> {
    if (!blocks.length) {
      return undefined;
    }

    // Narrow the search space
    const channelName = event.getHandler().getName();
    const sender = event.getSender();
    const candidates = blocks.filter(
      (b) =>
        this.isChannelSupported(b, channelName) &&
        this.matchesSubscriberLabels(b, sender),
    );

    if (!candidates.length) {
      return undefined;
    }

    // Priority goes to block who target users with labels
    const prioritizedCandidates = candidates.sort(
      (a, b) => b.trigger_labels.length - a.trigger_labels.length,
    );

    // Perform a payload match & pick last createdAt
    const payload = event.getPayload();
    if (payload) {
      const payloadMatches = prioritizedCandidates.filter((b) => {
        return this.matchPayload(payload, b);
      });
      if (payloadMatches.length > 1 && !canHaveMultipleMatches) {
        // If the payload matches multiple blocks ,
        // we return undefined so that we trigger the local fallback
        return undefined;
      } else if (payloadMatches.length > 0) {
        // If we have a payload match, we return the first one
        // (which is the most recent one due to the sort)
        // and we don't check for text or NLP matches
        return payloadMatches[0];
      }
    }

    // Perform a text match (Text or Quick reply)
    const text = event.getText().trim();
    if (text) {
      const textMatches = prioritizedCandidates.filter((b) => {
        return this.matchText(text, b);
      });

      if (textMatches.length > 1 && !canHaveMultipleMatches) {
        // If the text matches multiple blocks (especially regex),
        // we return undefined so that we trigger the local fallback
        return undefined;
      } else if (textMatches.length > 0) {
        return textMatches[0];
      }
    }

    // Perform an NLP Match
    const nlp = event.getNLP();
    if (nlp) {
      const scoredEntities = await this.nlpService.computePredictionScore(nlp);

      if (scoredEntities.entities.length) {
        const penaltyFactor = await this.getPenaltyFactor();
        return this.matchBestNLP(
          prioritizedCandidates,
          scoredEntities,
          penaltyFactor,
        );
      }
    }

    return undefined;
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
   * Performs an NLU pattern match based on the predicted entities and/or values
   *
   * @param nlp - Parsed NLP entities
   * @param block - The block to test
   *
   * @returns The NLU patterns that matches the predicted entities
   */
  getMatchingNluPatterns<E extends NLU.ParseEntities, B extends BlockStub>(
    { entities }: E,
    block: B,
  ): NlpPattern[][] {
    // No nlp entities to check against
    if (entities.length === 0) {
      return [];
    }

    const nlpPatterns = block.patterns.filter((p) => {
      return Array.isArray(p);
    }) as NlpPattern[][];

    // No nlp patterns found
    if (nlpPatterns.length === 0) {
      return [];
    }

    // Filter NLP patterns match based on best guessed entities
    return nlpPatterns.filter((patterns: NlpPattern[]) => {
      return patterns.every((p: NlpPattern) => {
        if (p.match === 'value') {
          return entities.find((e) => {
            return (
              e.entity === p.entity &&
              (e.value === p.value || e.canonicalValue === p.value)
            );
          });
        } else if (p.match === 'entity') {
          return entities.find((e) => {
            return e.entity === p.entity;
          });
        } else {
          this.logger.warn('Unknown NLP match type', p);
          return false;
        }
      });
    });
  }

  /**
   * Finds and returns the block that best matches the given scored NLU entities.
   *
   * This function evaluates each block by matching its NLP patterns against the provided
   * `scoredEntities`, using `matchNLP` and `calculateNluPatternMatchScore` to compute
   * a confidence score for each match. The block with the highest total pattern match score
   * is returned.
   *
   * If no block yields a positive score, the function returns `undefined`.
   *
   * @param blocks - A list of blocks to evaluate, each potentially containing NLP patterns.
   * @param  scoredEntities - The scored NLU entities to use for pattern matching.
   *
   * @returns A promise that resolves to the block with the highest NLP match score,
   * or `undefined` if no suitable match is found.
   */
  matchBestNLP<B extends BlockStub>(
    blocks: B[],
    scoredEntities: NLU.ScoredEntities,
    penaltyFactor: number,
  ): B | undefined {
    const bestMatch = blocks.reduce(
      (bestMatch, block) => {
        const matchedPatterns = this.getMatchingNluPatterns(
          scoredEntities,
          block,
        );

        // Compute the score (Weighted sum = weight * confidence)
        // for each of block NLU patterns
        const score = matchedPatterns.reduce((maxScore, patterns) => {
          const score = this.calculateNluPatternMatchScore(
            patterns,
            scoredEntities,
            penaltyFactor,
          );
          return Math.max(maxScore, score);
        }, 0);
        return score > bestMatch.score ? { block, score } : bestMatch;
      },
      { block: undefined, score: 0 },
    );

    return bestMatch.block;
  }

  /**
   * Calculates the total NLU pattern match score by summing the individual pattern scores
   * for each pattern that matches a scored entity.
   *
   * For each pattern in the list, the function attempts to find a matching entity in the
   * NLU prediction. If a match is found, the score is computed using `computePatternScore`,
   * potentially applying a penalty if the match is generic (entity-only).
   *
   * This scoring mechanism allows the system to prioritize more precise matches and
   * quantify the overall alignment between predicted NLU entities and predefined patterns.
   *
   * @param patterns - A list of patterns to evaluate against the NLU prediction.
   * @param prediction - The scored entities resulting from NLU inference.
   *
   * @returns The total aggregated match score based on matched patterns and their computed scores.
   */
  calculateNluPatternMatchScore(
    patterns: NlpPattern[],
    prediction: NLU.ScoredEntities,
    penaltyFactor: number,
  ): number {
    if (!patterns.length || !prediction.entities.length) {
      return 0;
    }

    return patterns.reduce((score, pattern) => {
      const matchedEntity: NLU.ScoredEntity | undefined =
        prediction.entities.find((e) => this.matchesNluEntity(e, pattern));

      const patternScore = matchedEntity
        ? this.computePatternScore(matchedEntity, pattern, penaltyFactor)
        : 0;

      return score + patternScore;
    }, 0);
  }

  /**
   * Checks if a given `ParseEntity` from the NLP model matches the specified pattern
   * and if its value exists within the values provided in the cache for the specified entity.
   *
   * @param e - The `ParseEntity` object from the NLP model, containing information about the entity and its value.
   * @param pattern - The `NlpPattern` object representing the entity and value pattern to be matched.
   * @param entityData - The `NlpCacheMapValues` object containing cached data, including entity values and weight, for the entity being matched.
   *
   * @returns A boolean indicating whether the `ParseEntity` matches the pattern and entity data from the cache.
   *
   * - The function compares the entity type between the `ParseEntity` and the `NlpPattern`.
   * - If the pattern's match type is not `'value'`, it checks if the entity's value is present in the cache's `values` array.
   * - If the pattern's match type is `'value'`, it further ensures that the entity's value matches the specified value in the pattern.
   * - Returns `true` if all conditions are met, otherwise `false`.
   */
  private matchesNluEntity<E extends NLU.ParseEntity>(
    { entity, value, canonicalValue }: E,
    pattern: NlpPattern,
  ): boolean {
    return (
      entity === pattern.entity &&
      (pattern.match !== 'value' ||
        value === pattern.value ||
        canonicalValue === pattern.value)
    );
  }

  /**
   * Computes a pattern score by applying a penalty factor based on the matching rule of the pattern.
   *
   * This scoring mechanism allows prioritization of more specific patterns (entity + value) over
   * more generic ones (entity only).
   *
   * @param entity - The scored entity object containing the base score.
   * @param pattern - The pattern definition to match against the entity.
   * @param [penaltyFactor=0.95] - Optional penalty factor applied when the pattern only matches the entity (default is 0.95).
   *
   * @returns The final pattern score after applying any applicable penalty.
   */
  private computePatternScore(
    entity: NLU.ScoredEntity,
    pattern: NlpPattern,
    penaltyFactor: number = 0.95,
  ): number {
    if (!entity || !pattern) {
      return 0;
    }

    // In case the pattern matches the entity regardless of the value (any)
    // we apply a penalty so that we prioritize other patterns where both entity and value matches
    const penalty = pattern.match === 'entity' ? penaltyFactor : 1;

    return entity.score * penalty;
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
    const handlerName = event.getHandler().getName();
    const sender = event.getSender();
    const candidates = blocks.filter(
      (b) =>
        this.isChannelSupported(b, handlerName) &&
        this.matchesSubscriberLabels(b, sender),
    );

    if (!candidates.length) {
      return undefined;
    }

    return candidates.find((b) => {
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
   * @param isLocalFallback - Whenever to process main message or local fallback message
   * @param conversationId - The conversation ID
   *
   * @returns - Envelope containing message format and content following {format, message} object structure
   */
  async processMessage(
    block: Block | BlockFull,
    context: Context,
    subscriberContext: SubscriberContext,
    isLocalFallback = false,
    conversationId?: string,
  ): Promise<StdOutgoingEnvelope> {
    const settings = await this.settingService.getSettings();
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
    const fallback = isLocalFallback ? block.options?.fallback : undefined;

    if (Array.isArray(block.message)) {
      // Text Message
      return envelopeFactory.buildTextEnvelope(
        fallback ? fallback.message : block.message,
      );
    } else if ('text' in block.message) {
      if (
        'quickReplies' in block.message &&
        Array.isArray(block.message.quickReplies) &&
        block.message.quickReplies.length > 0
      ) {
        return envelopeFactory.buildQuickRepliesEnvelope(
          fallback ? fallback.message : block.message.text,
          block.message.quickReplies,
        );
      } else if (
        'buttons' in block.message &&
        Array.isArray(block.message.buttons) &&
        block.message.buttons.length > 0
      ) {
        return envelopeFactory.buildButtonsEnvelope(
          fallback ? fallback.message : block.message.text,
          block.message.buttons,
        );
      }
    } else if ('attachment' in block.message) {
      const attachmentPayload = block.message.attachment.payload;
      if (!('id' in attachmentPayload)) {
        this.checkDeprecatedAttachmentUrl(block);
        throw new Error(
          'Remote attachments in blocks are no longer supported!',
        );
      }
      const quickReplies = block.message.quickReplies
        ? [...block.message.quickReplies]
        : [];

      if (fallback) {
        return quickReplies.length > 0
          ? envelopeFactory.buildQuickRepliesEnvelope(
              fallback.message,
              quickReplies,
            )
          : envelopeFactory.buildTextEnvelope(fallback.message);
      }
      return envelopeFactory.buildAttachmentEnvelope(
        {
          type: block.message.attachment.type,
          payload: block.message.attachment.payload,
        },
        quickReplies,
      );
    } else if (
      block.message &&
      'elements' in block.message &&
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
        const { elements, pagination } = await this.contentService.getContent(
          contentBlockOptions,
          skip,
        );

        return fallback
          ? envelopeFactory.buildTextEnvelope(fallback.message)
          : envelopeFactory.buildListEnvelope(
              contentBlockOptions.display as
                | OutgoingMessageFormat.list
                | OutgoingMessageFormat.carousel,
              contentBlockOptions,
              elements,
              pagination,
            );
      } catch (err) {
        this.logger.error(
          'Unable to retrieve content for list template process',
          err,
        );
        throw err;
      }
    } else if (block.message && 'plugin' in block.message) {
      if (fallback) {
        return envelopeFactory.buildTextEnvelope(fallback.message);
      }

      const plugin = this.pluginService.findPlugin(
        PluginType.block,
        block.message.plugin,
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
        throw new Error(`Plugin Error - ${JSON.stringify(block.message)}`);
      }
    }
    throw new Error('Invalid message format.');
  }

  /**
   * Retrieves the fallback options for a block.
   *
   * @param block - The block to retrieve fallback options from.
   * @returns The fallback options for the block, or default options if not specified.
   */
  getFallbackOptions<T extends BlockStub>(block: T): FallbackOptions {
    return block.options?.fallback ?? getDefaultFallbackOptions();
  }

  /**
   * Updates the `trigger_labels` and `assign_labels` fields of a block when a label is deleted.
   *
   * @param _query - The Mongoose query object used for deletion.
   * @param criteria - The filter criteria for finding the labels to be deleted.
   */
  @OnEvent('hook:label:preDelete')
  async handleLabelPreDelete(
    _query: unknown,
    criteria: TFilterQuery<Label>,
  ): Promise<void> {
    if (criteria._id) {
      await this.getRepository().model.updateMany(
        {
          $or: [
            { trigger_labels: criteria._id },
            { assign_labels: criteria._id },
          ],
        },
        {
          $pull: {
            trigger_labels: criteria._id,
            assign_labels: criteria._id,
          },
        },
      );
    } else {
      throw new Error('Attempted to delete label using unknown criteria');
    }
  }
}
