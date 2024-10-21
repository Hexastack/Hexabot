/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Format } from "@/services/types";

import { IBaseSchema, IFormat } from "./base.types";

export enum SettingType {
  text = "text",
  textarea = "textarea",
  secret = "secret",
  multiple_text = "multiple_text",
  checkbox = "checkbox",
  select = "select",
  number = "number",
  attachment = "attachment",
  multiple_attachment = "multiple_attachment",
}

export interface TextSetting extends IBaseSchema {
  type: SettingType.text;
  value: string;
  options: never;
  config: never;
}

export interface MultiTextSetting extends IBaseSchema {
  type: SettingType.multiple_text;
  value: string[];
  options: never;
  config: never;
}

export interface CheckboxSetting extends IBaseSchema {
  type: SettingType.checkbox;
  value: boolean;
  options: never;
  config: never;
}

export interface SelectSetting extends IBaseSchema {
  type: SettingType.select;
  value: string;
  options: string[];
  config: never;
}

export interface NumberSetting extends IBaseSchema {
  type: SettingType.number;
  value: number;
  options: never;
  config?: {
    min: number;
    max: number;
    step: number;
  };
}

export interface AttachmentSetting extends IBaseSchema {
  type: SettingType.attachment;
  value: string | null; // attachment id
  options: never;
  config: never;
}

export interface MultipleAttachmentSetting extends IBaseSchema {
  type: SettingType.multiple_attachment;
  value: string[]; // attachment ids
  options: never;
  config: never;
}

export type AnySetting =
  | TextSetting
  | MultiTextSetting
  | CheckboxSetting
  | SelectSetting
  | NumberSetting
  | AttachmentSetting
  | MultipleAttachmentSetting;

export interface ISettingAttributes {
  group: string;
  label: string;
  type: SettingType;
  value: any;
  options?: string[];
  config?: Record<string, any>;
  weight?: number;
}

export interface ISettingStub extends IBaseSchema, ISettingAttributes {}

export interface ISetting extends ISettingStub, IFormat<Format.BASIC> {}
