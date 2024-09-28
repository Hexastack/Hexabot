/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { I18nService } from '@/i18n/services/i18n.service';
import { SettingService } from '@/setting/services/setting.service';
import { BaseService } from '@/utils/generics/base-service';

import { Block } from '../../chat/schemas/block.schema';
import { BlockService } from '../../chat/services/block.service';
import { TranslationRepository } from '../repositories/translation.repository';
import { Translation } from '../schemas/translation.schema';

@Injectable()
export class TranslationService extends BaseService<Translation> {
  constructor(
    readonly repository: TranslationRepository,
    private readonly blockService: BlockService,
    private readonly settingService: SettingService,
    private readonly i18n: I18nService,
  ) {
    super(repository);
    this.resetI18nTranslations();
  }

  public async resetI18nTranslations() {
    const translations = await this.findAll();
    this.i18n.refreshDynamicTranslations(translations);
  }

  /**
   * Return any available string inside a given block (message, button titles, fallback messages, ...)
   *
   * @param block - The block to parse
   *
   * @returns An array of strings
   */
  getBlockStrings(block: Block): string[] {
    let strings: string[] = [];
    if (Array.isArray(block.message)) {
      // Text Messages
      strings = strings.concat(block.message);
    } else if (typeof block.message === 'object') {
      if ('plugin' in block.message) {
        // plugin
        Object.values(block.message.args).forEach((arg) => {
          if (Array.isArray(arg)) {
            // array of text
            strings = strings.concat(arg);
          } else if (typeof arg === 'string') {
            // text
            strings.push(arg);
          }
        });
      } else if ('text' in block.message && Array.isArray(block.message.text)) {
        // array of text
        strings = strings.concat(block.message.text);
      } else if (
        'text' in block.message &&
        typeof block.message.text === 'string'
      ) {
        // text
        strings.push(block.message.text);
      }
      if (
        'quickReplies' in block.message &&
        Array.isArray(block.message.quickReplies) &&
        block.message.quickReplies.length > 0
      ) {
        // Quick replies
        strings = strings.concat(
          block.message.quickReplies.map((qr) => qr.title),
        );
      } else if (
        'buttons' in block.message &&
        Array.isArray(block.message.buttons) &&
        block.message.buttons.length > 0
      ) {
        // Buttons
        strings = strings.concat(block.message.buttons.map((btn) => btn.title));
      }
    }
    // Add fallback messages
    if (
      'fallback' in block.options &&
      block.options.fallback &&
      'message' in block.options.fallback &&
      Array.isArray(block.options.fallback.message)
    ) {
      strings = strings.concat(block.options.fallback.message);
    }
    return strings;
  }

  /**
   * Return any available string inside a block (message, button titles, fallback messages, ...)
   *
   * @returns A promise of all strings available in a array
   */
  async getAllBlockStrings(): Promise<string[]> {
    const blocks = await this.blockService.find({});
    if (blocks.length === 0) {
      return [];
    }
    return blocks.reduce((acc, block) => {
      const strings = this.getBlockStrings(block);
      return acc.concat(strings);
    }, [] as string[]);
  }

  /**
   * Return any available strings in settings
   *
   * @returns A promise of all strings available in a array
   */
  async getSettingStrings(): Promise<string[]> {
    let strings: string[] = [];
    const settings = await this.settingService.getSettings();
    if (settings.chatbot_settings.global_fallback) {
      strings = strings.concat(settings.chatbot_settings.fallback_message);
    }
    return strings;
  }

  /**
   * Updates the in-memory translations
   */
  @OnEvent('hook:translation:*')
  handleTranslationsUpdate() {
    this.resetI18nTranslations();
  }
}
