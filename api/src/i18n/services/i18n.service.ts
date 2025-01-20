/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import {
  I18nService as NativeI18nService,
  Path,
  PathValue,
  TranslateOptions,
} from 'nestjs-i18n';
import { IfAnyOrNever } from 'nestjs-i18n/dist/types';

import { config } from '@/config';
import { Translation } from '@/i18n/schemas/translation.schema';

@Injectable()
export class I18nService<
  K = Record<string, unknown>,
> extends NativeI18nService<K> {
  private dynamicTranslations: Record<string, Record<string, string>> = {};

  t<P extends Path<K> = any, R = PathValue<K, P>>(
    key: P,
    options?: TranslateOptions,
  ): IfAnyOrNever<R, string, R> {
    options = {
      ...options,
      lang: options?.lang || this.i18nOptions.fallbackLanguage,
      defaultValue: options?.defaultValue || key,
    };
    let { lang } = options;

    lang = this.resolveLanguage(lang!);

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
}
