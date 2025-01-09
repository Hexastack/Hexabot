/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { AttachmentService } from '@/attachment/services/attachment.service';
import EventWrapper from '@/channel/lib/EventWrapper';
import { ContentService } from '@/cms/services/content.service';
import { CONSOLE_CHANNEL_NAME } from '@/extensions/channels/console/settings';
import { NLU } from '@/helper/types';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { PluginService } from '@/plugins/plugins.service';
import { PluginName, PluginType } from '@/plugins/types';
import { SettingService } from '@/setting/services/setting.service';
import { BaseService } from '@/utils/generics/base-service';
import { getRandom } from '@/utils/helpers/safeRandom';

import { BlockRepository } from '../repositories/block.repository';
import { Block, BlockFull, BlockPopulate } from '../schemas/block.schema';
import { Context } from '../schemas/types/context';
import {
  BlockMessage,
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
} from '../schemas/types/message';
import { NlpPattern, Pattern, PayloadPattern } from '../schemas/types/pattern';
import { Payload, StdQuickReply } from '../schemas/types/quick-reply';
import { SubscriberContext } from '../schemas/types/subscriberContext';

@Injectable()
export class BlockService extends BaseService<Block, BlockPopulate, BlockFull> {
  constructor(
    readonly repository: BlockRepository,
    private readonly contentService: ContentService,
    private readonly attachmentService: AttachmentService,
    private readonly settingService: SettingService,
    private readonly pluginService: PluginService,
    private readonly logger: LoggerService,
    protected readonly i18n: I18nService,
    protected readonly languageService: LanguageService,
  ) {
    super(repository);
  }

  /**
   * Find a block whose patterns matches the received event
   *
   * @param blocks blocks Starting/Next blocks in the conversation flow
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

    // Perform a filter on the specific channels
    const channel = event.getHandler().getName();
    blocks = blocks.filter((b) => {
      return (
        !b.trigger_channels ||
        b.trigger_channels.length === 0 ||
        [...b.trigger_channels, CONSOLE_CHANNEL_NAME].includes(channel)
      );
    });

    // Perform a filter on trigger labels
    let userLabels: string[] = [];
    const profile = event.getSender();
    if (profile && Array.isArray(profile.labels)) {
      userLabels = profile.labels.map((l) => l);
    }

    blocks = blocks
      .filter((b) => {
        const trigger_labels = b.trigger_labels.map(({ id }) => id);
        return (
          trigger_labels.length === 0 ||
          trigger_labels.some((l) => userLabels.includes(l))
        );
      })
      // Priority goes to block who target users with labels
      .sort((a, b) => b.trigger_labels.length - a.trigger_labels.length);

    // Perform a payload match & pick last createdAt
    if (payload) {
      block = blocks
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
      block = blocks
        .filter((b) => {
          return this.matchText(text, b);
        })
        .shift();

      // Perform an NLP Match
      if (!block && nlp) {
        // Find block pattern having the best match of nlp entities
        let nlpBest = 0;
        blocks.forEach((b, index, self) => {
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
    const patterns: undefined | Pattern[] = block.patterns?.map((pattern) => {
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
          this.logger.warn('Block Service : Unknown NLP match type', ev);
          return false;
        }
      });
    });
  }

  /**
   * Replaces tokens with their context variables values in the provided text message
   *
   * `You phone number is {context.vars.phone}`
   * Becomes
   * `You phone number is 6354-543-534`
   *
   * @param text - Text message
   * @param context - Variable holding context values relative to the subscriber
   *
   * @returns Text message with the tokens being replaced
   */
  processTokenReplacements(
    text: string,
    context: Context,
    subscriberContext: SubscriberContext,
    settings: Settings,
  ): string {
    const vars = { ...(subscriberContext?.vars || {}), ...context.vars };
    // Replace context tokens with their values
    Object.keys(vars).forEach((key) => {
      if (typeof vars[key] === 'string' && vars[key].indexOf(':') !== -1) {
        const tmp = vars[key].split(':');
        vars[key] = tmp[1];
      }
      text = text.replace(
        '{context.vars.' + key + '}',
        typeof vars[key] === 'string' ? vars[key] : JSON.stringify(vars[key]),
      );
    });

    // Replace context tokens about user location
    if (context.user_location) {
      if (context.user_location.address) {
        const userAddress = context.user_location.address;
        Object.keys(userAddress).forEach((key) => {
          text = text.replace(
            '{context.user_location.address.' + key + '}',
            typeof userAddress[key] === 'string'
              ? userAddress[key]
              : JSON.stringify(userAddress[key]),
          );
        });
      }
      text = text.replace(
        '{context.user_location.lat}',
        context.user_location.lat.toString(),
      );
      text = text.replace(
        '{context.user_location.lon}',
        context.user_location.lon.toString(),
      );
    }

    // Replace tokens for user infos
    Object.keys(context.user).forEach((key) => {
      const userAttr = (context.user as any)[key];
      text = text.replace(
        '{context.user.' + key + '}',
        typeof userAttr === 'string' ? userAttr : JSON.stringify(userAttr),
      );
    });

    // Replace contact infos tokens with their values
    Object.keys(settings.contact).forEach((key) => {
      text = text.replace('{contact.' + key + '}', settings.contact[key]);
    });

    return text;
  }

  /**
   * Translates and replaces tokens with context variables values
   *
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
    // Translate
    text = this.i18n.t(text, {
      lang: context.user.language,
      defaultValue: text,
    });
    // Replace context tokens
    text = this.processTokenReplacements(
      text,
      context,
      subscriberContext,
      settings,
    );
    return text;
  }

  /**
   * Return a randomly picked item of the array
   *
   * @param array - Array of any type
   *
   * @returns A random item from the array
   */
  getRandom<T>(array: T[]): T {
    return Array.isArray(array)
      ? array[Math.floor(getRandom() * array.length)]
      : array;
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
        'Attachment Model : `url` payload has been deprecated in favor of `attachment_id`',
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
  ) {
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
        this.getRandom(blockMessage),
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
      if (!attachmentPayload.attachment_id) {
        this.checkDeprecatedAttachmentUrl(block);
        throw new Error('Remote attachments are no longer supported!');
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
        blockMessage.plugin as PluginName,
      );
      // Process custom plugin block
      try {
        return await plugin?.process(block, context, conversationId);
      } catch (e) {
        this.logger.error('Plugin was unable to load/process ', e);
        throw new Error(`Unknown plugin - ${JSON.stringify(blockMessage)}`);
      }
    } else {
      throw new Error('Invalid message format.');
    }
  }
}
