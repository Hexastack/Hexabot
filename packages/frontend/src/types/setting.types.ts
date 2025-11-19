/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
