/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import z from 'zod';

import { HelperSetting } from '@/helper/types';
import { createSettingGroup } from '@/setting/create-setting-group';
import { buildSettingSeedsFromSchema } from '@/setting/runtime-settings.seed';

export const LOCAL_STORAGE_HELPER_NAME = 'local-storage-helper' as const;

export const LOCAL_STORAGE_HELPER_NAMESPACE = 'local_storage_helper' as const;

export const LOCAL_STORAGE_HELPER_SETTINGS_SCHEMA = z.strictObject({});

declare global {
  interface RuntimeSettingRegistry {
    [LOCAL_STORAGE_HELPER_NAMESPACE]: typeof LOCAL_STORAGE_HELPER_SETTINGS_SCHEMA;
  }
}

export const LocalStorageHelperSettingsGroup = createSettingGroup({
  group: LOCAL_STORAGE_HELPER_NAMESPACE,
  schema: LOCAL_STORAGE_HELPER_SETTINGS_SCHEMA,
  scope: 'extension',
  extensionType: 'helper',
  extensionName: LOCAL_STORAGE_HELPER_NAME,
});

export const LOCAL_STORAGE_HELPER_SETTINGS = buildSettingSeedsFromSchema(
  LOCAL_STORAGE_HELPER_NAMESPACE,
  LOCAL_STORAGE_HELPER_SETTINGS_SCHEMA,
) as HelperSetting<typeof LOCAL_STORAGE_HELPER_NAME>[];

export default LocalStorageHelperSettingsGroup;
