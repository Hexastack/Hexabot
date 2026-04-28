/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SettingService } from '@/setting';

export const SettingServiceProvider = {
  provide: SettingService,
  useValue: {
    getSettings: jest.fn().mockResolvedValue({
      global_settings: {
        license_key: '',
        default_storage_helper: 'local-storage',
      },
    }),
    find: jest.fn().mockReturnValue([]),
  },
};
