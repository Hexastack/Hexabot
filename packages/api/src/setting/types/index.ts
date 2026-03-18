/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7 as JsonSchema } from 'json-schema';

export type SettingValue =
  | null
  | string
  | number
  | boolean
  | string[]
  | Record<string, any>;

export type SettingSchema = JsonSchema & {
  default?: SettingValue;
  enum?: readonly string[] | string[];
  'ui:field'?: string;
  'ui:widget'?: string;
  'ui:options'?: Record<string, unknown>;
};

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

export interface SettingSeedBase {
  subgroup?: string;
  label: string;
  schema: SettingSchema;
  translatable?: boolean;
}

export interface SettingSeed extends SettingSeedBase {
  group: string;
  weight?: number;
}

export type SettingFieldDefinition = Omit<SettingSeed, 'group' | 'label'>;

export type ExtensionSetting<E extends object = object> = E &
  SettingSeedBase & {
    group: string;
    weight?: number;
  };
