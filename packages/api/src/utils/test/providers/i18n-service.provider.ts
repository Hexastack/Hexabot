/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { I18nService } from '@/i18n/services/i18n.service';

export const I18nServiceProvider = {
  provide: I18nService,
  useValue: {
    t: jest.fn().mockImplementation((t) => t),
    getJsonSchemaLocalizationOptions: jest
      .fn()
      .mockImplementation((ns: string, lang?: string) => ({
        localize: {
          i18n: I18nServiceProvider.useValue,
          ns,
          ...(lang ? { lang } : {}),
        },
      })),
    refreshDynamicTranslations: jest.fn(),
  },
};
