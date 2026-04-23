/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { RuntimeSettingGroupSchema, RuntimeSettings } from './runtime-settings';

declare global {
  type SettingObject<T extends RuntimeSettingGroupSchema> = z.infer<T>;

  type SettingMapByType<T extends RuntimeSettingGroupSchema> = {
    [K in keyof z.infer<T> & string]: Setting;
  };

  interface Settings extends RuntimeSettings {}
}
