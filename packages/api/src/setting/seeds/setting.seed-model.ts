/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DEFAULT_GLOBAL_SETTING_SCHEMAS } from '../default.settings';
import { SettingCreateDto } from '../dto/setting.dto';
import { buildSettingSeedsFromSchema } from '../runtime-settings.seed';

export const DEFAULT_SETTINGS: SettingCreateDto[] =
  DEFAULT_GLOBAL_SETTING_SCHEMAS.flatMap(({ group, schema }) => {
    return buildSettingSeedsFromSchema(group, schema);
  });
