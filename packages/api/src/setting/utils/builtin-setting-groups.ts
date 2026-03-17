/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import CONSOLE_CHANNEL_SETTINGS from '@/extensions/channels/console/settings';
import WEB_CHANNEL_SETTINGS from '@/extensions/channels/web/settings';
import LOCAL_STORAGE_HELPER_SETTINGS from '@/extensions/helpers/local-storage/settings';

import { DEFAULT_SETTINGS } from '../seeds/setting.seed-model';

import {
  SettingSchemaSource,
  groupSettingSchemaSources,
} from './setting-schema.utils';

const BUILTIN_SETTING_GROUP_LIST = [
  ...DEFAULT_SETTINGS,
  ...WEB_CHANNEL_SETTINGS,
  ...CONSOLE_CHANNEL_SETTINGS,
  ...LOCAL_STORAGE_HELPER_SETTINGS,
] as const satisfies readonly SettingSchemaSource[];

export const BUILTIN_SETTING_GROUPS = groupSettingSchemaSources(
  BUILTIN_SETTING_GROUP_LIST,
);
