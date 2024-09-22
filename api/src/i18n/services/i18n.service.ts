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
import {
  I18nService as NativeI18nService,
  Path,
  PathValue,
  TranslateOptions,
} from 'nestjs-i18n';
import { IfAnyOrNever } from 'nestjs-i18n/dist/types';

import { Translation } from '@/chat/schemas/translation.schema';
import { config } from '@/config';

@Injectable()
export class I18nService<
  K = Record<string, unknown>,
> extends NativeI18nService<K> {
  private dynamicTranslations: Record<string, Record<string, string>> =
    config.chatbot.lang.available.reduce(
      (acc, curr) => ({ ...acc, [curr]: {} }),
      {},
    );

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
    lang = lang ?? this.i18nOptions.fallbackLanguage;
    lang = this.resolveLanguage(lang);

    // Translate block message, button text, ...
    if (lang in this.dynamicTranslations) {
      if (key in this.dynamicTranslations[lang]) {
        return this.dynamicTranslations[lang][key] as IfAnyOrNever<
          R,
          string,
          R
        >;
      }
    }

    // Otherwise, call the original `t` method from I18nService
    key = `${config.i18n.translationFilename}.${key}` as P;
    return super.t<P, R>(key, options);
  }

  @OnEvent('hook:i18n:refresh')
  initDynamicTranslations(translations: Translation[]) {
    this.dynamicTranslations = translations.reduce((acc, curr) => {
      const { str, translations } = curr;
      Object.entries(translations)
        .filter(([lang]) => lang in acc)
        .forEach(([lang, t]) => {
          acc[lang][str] = t;
        });

      return acc;
    }, this.dynamicTranslations);
  }
}
