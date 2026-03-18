/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { HelperSetting } from '@/helper/types';
import { SettingFieldDefinition } from '@/setting/types';

export const TEST_HELPER_NAME = 'test-helper';

export const TEST_HELPER_NAMESPACE = 'test_helper';

export const testHelperSettingsSchema = z
  .object({
    test: z.string(),
  })
  .strict();

export type TestHelperSettings = z.infer<typeof testHelperSettingsSchema>;

export const TEST_HELPER_SETTING_FIELDS = {
  test: {
    schema: {
      type: 'string',
      default: 'test',
    },
  },
} as const satisfies Record<keyof TestHelperSettings, SettingFieldDefinition>;

export const settingsSchema = testHelperSettingsSchema;

const TEST_HELPER_SETTINGS = Object.entries(TEST_HELPER_SETTING_FIELDS).map(
  ([label, definition]) => ({
    group: TEST_HELPER_NAMESPACE,
    label,
    ...definition,
  }),
) satisfies HelperSetting<typeof TEST_HELPER_NAME>[];

export default TEST_HELPER_SETTINGS;
