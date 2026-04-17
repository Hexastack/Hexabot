/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SettingService } from '@/setting';

export const SettingServiceProvider = {
  provide: SettingService,
  useValue: {
    default_nlu_helper: 'llm-nlu',
    getSettings: jest.fn().mockResolvedValue({
      chatbot_settings: {
        default_nlu_helper: 'llm-nlu',
        global_fallback: true,
        fallback_message: ['Global fallback message'],
      },
    }),
    find: jest.fn().mockImplementation((criteria: { translatable?: boolean }) =>
      [
        {
          translatable: true,
          group: 'default',
          value: 'Global fallback message',
          label: 'fallback_message',
        },
      ].filter((s) =>
        criteria && 'translatable' in criteria
          ? s.translatable === criteria.translatable
          : true,
      ),
    ),
  },
};
