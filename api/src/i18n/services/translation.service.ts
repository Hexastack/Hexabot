/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { I18nService } from '@/i18n/services/i18n.service';
import { PluginService } from '@/plugins/plugins.service';
import { PluginType } from '@/plugins/types';
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
    private readonly pluginService: PluginService,
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
  async getBlockStrings(block: Block): Promise<string[]> {
    let strings: string[] = [];

    if (Array.isArray(block.message)) {
      // Text Messages
      strings = strings.concat(block.message);
    } else if (typeof block.message === 'object') {
      if ('plugin' in block.message) {
        const plugin = this.pluginService.getPlugin(
          PluginType.block,
          block.message.plugin,
        );
        const defaultSettings = await plugin?.getDefaultSettings();

        // plugin
        Object.entries(block.message.args).forEach(([l, arg]) => {
          const setting = defaultSettings?.find(({ label }) => label === l);
          if (setting?.translatable) {
            if (Array.isArray(arg)) {
              // array of text
              strings = strings.concat(arg);
            } else if (typeof arg === 'string') {
              // text
              strings.push(arg);
            }
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
      block.options &&
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
    const allStrings: string[] = [];
    for (const block of blocks) {
      const strings = await this.getBlockStrings(block);
      allStrings.push(...strings);
    }
    return allStrings;
  }

  /**
   * Return any available strings in settings
   *
   * @returns A promise of all strings available in a array
   */
  async getSettingStrings(): Promise<string[]> {
    const translatableSettings = await this.settingService.find({
      translatable: true,
    });
    const settings = await this.settingService.getSettings();
    return Object.values(settings)
      .map((group: Record<string, string | string[]>) => Object.entries(group))
      .flat()
      .filter(([l]) => {
        return translatableSettings.find(({ label }) => label === l);
      })
      .map(([, v]) => v)
      .flat();
  }

  /**
   * Updates the in-memory translations
   */
  @OnEvent('hook:translation:*')
  handleTranslationsUpdate() {
    this.resetI18nTranslations();
  }
}
