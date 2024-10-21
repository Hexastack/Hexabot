/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { existsSync, promises as fs } from 'fs';
import * as path from 'path';

import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  I18nJsonLoader,
  I18nTranslation,
  I18nService as NativeI18nService,
  Path,
  PathValue,
  TranslateOptions,
} from 'nestjs-i18n';
import { IfAnyOrNever } from 'nestjs-i18n/dist/types';

import { config } from '@/config';
import { Translation } from '@/i18n/schemas/translation.schema';
import { hyphenToUnderscore } from '@/utils/helpers/misc';

@Injectable()
export class I18nService<K = Record<string, unknown>>
  extends NativeI18nService<K>
  implements OnModuleInit
{
  private dynamicTranslations: Record<string, Record<string, string>> = {};

  private extensionTranslations: I18nTranslation = {};

  onModuleInit() {
    this.loadExtensionI18nTranslations();
  }

  getExtensionI18nTranslations() {
    return this.extensionTranslations;
  }

  t<P extends Path<K> = any, R = PathValue<K, P>>(
    key: P,
    options?: TranslateOptions,
  ): IfAnyOrNever<R, string, R> {
    options = {
      lang: this.i18nOptions.fallbackLanguage,
      defaultValue: key,
      ...options,
    };
    let { lang } = options;
    lang = this.resolveLanguage(lang);

    // Translate block message, button text, ...
    if (lang in this.dynamicTranslations) {
      if (key in this.dynamicTranslations[lang]) {
        if (this.dynamicTranslations[lang][key]) {
          return this.dynamicTranslations[lang][key] as IfAnyOrNever<
            R,
            string,
            R
          >;
        }
        return options.defaultValue as IfAnyOrNever<R, string, R>;
      }
    }

    // Otherwise, call the original `t` method from I18nService
    key = `${config.i18n.translationFilename}.${key}` as P;
    return super.t<P, R>(key, options);
  }

  refreshDynamicTranslations(translations: Translation[]) {
    this.dynamicTranslations = translations.reduce((acc, curr) => {
      const { str, translations } = curr;
      Object.entries(translations).forEach(([lang, t]) => {
        acc[lang] = acc[lang] || {};
        acc[lang][str] = t;
      });

      return acc;
    }, this.dynamicTranslations);
  }

  async loadExtensionI18nTranslations() {
    const baseDir = path.join(__dirname, '..', '..', 'extensions');
    const extensionTypes = ['channels', 'helpers', 'plugins'];

    try {
      for (const type of extensionTypes) {
        const extensionsDir = path.join(baseDir, type);

        if (!existsSync(extensionsDir)) {
          continue;
        }

        const extensionFolders = await fs.readdir(extensionsDir, {
          withFileTypes: true,
        });

        for (const folder of extensionFolders) {
          if (folder.isDirectory()) {
            const i18nPath = path.join(extensionsDir, folder.name, 'i18n');
            const namespace = hyphenToUnderscore(folder.name);
            try {
              // Check if the i18n directory exists
              await fs.access(i18nPath);

              // Load and merge translations
              const i18nLoader = new I18nJsonLoader({ path: i18nPath });
              const translations = await i18nLoader.load();
              for (const lang in translations) {
                if (!this.extensionTranslations[lang]) {
                  this.extensionTranslations[lang] = {
                    [namespace]: translations[lang],
                  };
                } else {
                  this.extensionTranslations[lang][namespace] =
                    translations[lang];
                }
              }
            } catch (error) {
              // If the i18n folder does not exist or error in reading, skip this folder
            }
          }
        }
      }
    } catch (error) {
      throw new Error(`Failed to read extensions directory: ${error.message}`);
    }
  }
}
