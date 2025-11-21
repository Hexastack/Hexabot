/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { I18nService } from '@/i18n';

export const I18nServiceProvider = {
  provide: I18nService,
  useValue: {
    t: jest.fn().mockImplementation((t) => t),
    refreshDynamicTranslations: jest.fn(),
  },
};
