/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Setting } from '@/setting/dto/setting.dto';

export enum SettingType {
  text = 'text',
  textarea = 'textarea',
  secret = 'secret',
  multiple_text = 'multiple_text',
  checkbox = 'checkbox',
  select = 'select',
  number = 'number',
  attachment = 'attachment',
  multiple_attachment = 'multiple_attachment',
}

export enum FieldType {
  text = 'text',
  url = 'url',
  textarea = 'textarea',
  checkbox = 'checkbox',
  file = 'file',
  html = 'html',
}

export interface TextSetting extends Setting {
  type: SettingType.text;
  value: string;
  options: never;
  config: never;
}

export interface TextareaSetting extends Setting {
  type: SettingType.textarea;
  value: string;
  options: never;
  config: never;
}

export interface SecretSetting extends Setting {
  type: SettingType.secret;
  value: string;
  options: never;
  config: never;
}

export interface MultiTextSetting extends Setting {
  type: SettingType.multiple_text;
  value: string[];
  options: never;
  config: never;
}

export interface CheckboxSetting extends Setting {
  type: SettingType.checkbox;
  value: boolean;
  options: never;
  config: never;
}

export interface SelectSetting extends Setting {
  type: SettingType.select;
  value: string;
  options: string[];
  config: never;
}

export interface NumberSetting extends Setting {
  type: SettingType.number;
  value: number;
  options: never;
  config?: {
    min: number;
    max: number;
    step: number;
  };
}

export interface AttachmentSetting extends Setting {
  type: SettingType.attachment;
  value: string | null; // attachment id
  options: never;
  config: never;
}

export interface MultipleAttachmentSetting extends Setting {
  type: SettingType.multiple_attachment;
  value: string[]; // attachment ids
  options: never;
  config: never;
}

export type SettingByType<T extends SettingType> = T extends SettingType.text
  ? TextSetting
  : T extends SettingType.textarea
    ? TextareaSetting
    : T extends SettingType.secret
      ? SecretSetting
      : T extends SettingType.multiple_text
        ? MultiTextSetting
        : T extends SettingType.checkbox
          ? CheckboxSetting
          : T extends SettingType.select
            ? SelectSetting
            : T extends SettingType.number
              ? NumberSetting
              : T extends SettingType.attachment
                ? AttachmentSetting
                : T extends SettingType.multiple_attachment
                  ? MultipleAttachmentSetting
                  : never;

export type AnySetting =
  | TextSetting
  | TextareaSetting
  | SecretSetting
  | MultiTextSetting
  | CheckboxSetting
  | SelectSetting
  | NumberSetting
  | AttachmentSetting
  | MultipleAttachmentSetting;

export type SettingDict = { [group: string]: Setting[] };

type NonNeverKeys<T> = {
  [K in keyof T]-?: T[K] extends never ? never : K;
}[keyof T];

type StripNever<T> = Pick<T, NonNeverKeys<T>>;

export type ExtensionSetting<
  E extends object = object,
  U extends AnySetting = AnySetting,
  K extends keyof Setting = 'id' | 'createdAt' | 'updatedAt',
> = U extends any ? Omit<StripNever<U>, K> & E : never;

export type SettingSeed = ExtensionSetting<
  {
    group: string;
    weight?: number;
  },
  AnySetting,
  'id' | 'createdAt' | 'updatedAt' | 'group' | 'weight'
>;
