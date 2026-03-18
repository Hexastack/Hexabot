/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { HelperSetting } from '@/helper/types';
import { SettingFieldDefinition } from '@/setting/types';

export const LOCAL_STORAGE_HELPER_NAME = 'local-storage-helper';

export const LOCAL_STORAGE_HELPER_NAMESPACE = 'local-storage-helper';

export const localStorageHelperSettingsSchema = z.object({}).strict();

export type LocalStorageHelperSettings = z.infer<
  typeof localStorageHelperSettingsSchema
>;

export const LOCAL_STORAGE_HELPER_SETTING_FIELDS = {} as const satisfies Record<
  keyof LocalStorageHelperSettings,
  SettingFieldDefinition
>;

export const settingsSchema = localStorageHelperSettingsSchema;

const LOCAL_STORAGE_HELPER_SETTINGS = [] satisfies HelperSetting<
  typeof LOCAL_STORAGE_HELPER_NAME
>[];

export default LOCAL_STORAGE_HELPER_SETTINGS;
