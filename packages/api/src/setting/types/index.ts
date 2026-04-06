/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Setting } from '@/setting/dto/setting.dto';

export enum FieldType {
  text = 'text',
  url = 'url',
  textarea = 'textarea',
  checkbox = 'checkbox',
  file = 'file',
  html = 'html',
}

export type AnySetting = Setting;

export type SettingDict = { [group: string]: Setting[] };

export type ExtensionSetting<
  E extends object = object,
  U extends AnySetting = AnySetting,
  K extends keyof Setting = 'id' | 'createdAt' | 'updatedAt',
> = Omit<U, K> & E;

export type SettingSeed = ExtensionSetting<
  {
    group: string;
  },
  AnySetting,
  'id' | 'createdAt' | 'updatedAt' | 'group'
>;
