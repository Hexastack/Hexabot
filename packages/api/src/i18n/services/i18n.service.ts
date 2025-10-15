/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
import { Translation } from '@/i18n/entities/translation.entity';

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
