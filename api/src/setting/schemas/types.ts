/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Setting } from './setting.schema';

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

/**
 * The following interfaces are declared, and currently not used
 * TextSetting
 * MultiTextSetting
 * CheckboxSetting
 * SelectSetting
 * NumberSetting
 * AttachmentSetting
 * MultipleAttachmentSetting
 * AnySetting
 **/
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
  | MultiTextSetting
  | CheckboxSetting
  | SelectSetting
  | NumberSetting
  | AttachmentSetting
  | MultipleAttachmentSetting;

export type SettingDict = { [group: string]: Setting[] };
