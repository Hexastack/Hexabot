/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { Setting } from './dto/setting.dto';
import { DEFAULT_SETTING_SCHEMAS } from './seeds/setting.seed-model';

declare global {
  type SettingSchemaMap = Record<string, z.ZodTypeAny>;

  type SettingFieldMap = Record<string, Record<string, object>>;

  type SettingTreeFromSchemaMap<T extends SettingSchemaMap> = {
    [Group in keyof T & string]: z.infer<T[Group]>;
  };

  type SettingEventMapFromFields<T extends SettingFieldMap> = {
    [Group in keyof T & string]: {
      [Label in keyof T[Group] & string]: Setting;
    };
  };

  type SettingDefinitionMapFromFields<T extends SettingFieldMap> = {
    [Group in keyof T & string]: {
      [Label in keyof T[Group] & string]: {
        group: Group;
        label: Label;
      } & T[Group][Label];
    };
  };

  interface Settings
    extends SettingTreeFromSchemaMap<typeof DEFAULT_SETTING_SCHEMAS> {}
}
