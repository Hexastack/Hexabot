/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  JSONSchema7 as JsonSchema,
  JSONSchema7TypeName as JsonSchemaTypeName,
} from 'json-schema';
import { z } from 'zod';

import { SettingSchema, SettingType, SettingValue } from '../types';

const TEXTAREA_WIDGET = 'textarea' as const;
const PASSWORD_WIDGET = 'password' as const;
const AUTOCOMPLETE_WIDGET = 'AutoCompleteWidget' as const;
const ATTACHMENT_FIELD = 'SettingAttachmentField' as const;
const MULTIPLE_ATTACHMENT_FIELD = 'SettingMultipleAttachmentField' as const;
const UI_WIDGET_KEY = 'ui:widget' as const;
const UI_FIELD_KEY = 'ui:field' as const;
const UI_OPTIONS_KEY = 'ui:options' as const;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');
const getSchemaTypeList = (schema?: JsonSchema): JsonSchemaTypeName[] => {
  const type = schema?.type;

  if (typeof type === 'string') {
    return [type];
  }

  return Array.isArray(type) ? [...type] : [];
};
const hasSchemaType = (
  schema: JsonSchema | undefined,
  type: JsonSchemaTypeName,
) => {
  return getSchemaTypeList(schema).includes(type);
};
const schemaAllowsNull = (schema?: JsonSchema) => {
  return hasSchemaType(schema, 'null');
};
const getUiWidget = (schema?: JsonSchema) => {
  return typeof schema?.[UI_WIDGET_KEY] === 'string'
    ? schema[UI_WIDGET_KEY]
    : undefined;
};
const getUiField = (schema?: JsonSchema) => {
  return typeof schema?.[UI_FIELD_KEY] === 'string'
    ? schema[UI_FIELD_KEY]
    : undefined;
};

export const getSettingUiOptions = (schema?: JsonSchema) => {
  return isRecord(schema?.[UI_OPTIONS_KEY])
    ? ({ ...schema[UI_OPTIONS_KEY] } as Record<string, unknown>)
    : undefined;
};

export const cloneSettingSchema = (schema?: JsonSchema): SettingSchema => {
  const next = isRecord(schema) ? { ...schema } : {};

  if (Array.isArray(schema?.enum)) {
    next.enum = [...schema.enum];
  }

  if (isRecord(schema?.items)) {
    next.items = { ...schema.items };
  }

  if (isRecord(schema?.[UI_OPTIONS_KEY])) {
    next[UI_OPTIONS_KEY] = { ...schema[UI_OPTIONS_KEY] };
  }

  return next as SettingSchema;
};

export const getSettingDefault = (
  schema?: JsonSchema,
): SettingValue | undefined => {
  return schema && 'default' in schema
    ? (schema.default as SettingValue | undefined)
    : undefined;
};

export const withSettingDefault = (
  schema: JsonSchema,
  value: SettingValue | undefined,
): SettingSchema => {
  const next = cloneSettingSchema(schema);

  if (value === undefined) {
    delete next.default;
  } else {
    next.default = value;
  }

  return next;
};

export const getSettingOptions = (schema?: JsonSchema) => {
  return isStringArray(schema?.enum) ? [...schema.enum] : undefined;
};

export const inferSettingType = (
  schema?: JsonSchema,
): SettingType | undefined => {
  const uiField = getUiField(schema);
  const uiWidget = getUiWidget(schema);

  if (uiField === ATTACHMENT_FIELD) {
    return SettingType.attachment;
  }

  if (uiField === MULTIPLE_ATTACHMENT_FIELD) {
    return SettingType.multiple_attachment;
  }

  if (hasSchemaType(schema, 'array')) {
    return SettingType.multiple_text;
  }

  if (hasSchemaType(schema, 'boolean')) {
    return SettingType.checkbox;
  }

  if (hasSchemaType(schema, 'number') || hasSchemaType(schema, 'integer')) {
    return SettingType.number;
  }

  if (hasSchemaType(schema, 'string')) {
    if (uiWidget === PASSWORD_WIDGET) {
      return SettingType.secret;
    }

    if (uiWidget === TEXTAREA_WIDGET) {
      return SettingType.textarea;
    }

    if (
      isStringArray(schema?.enum) ||
      uiWidget === AUTOCOMPLETE_WIDGET ||
      uiWidget === 'select'
    ) {
      return SettingType.select;
    }

    return SettingType.text;
  }

  return undefined;
};

export const getSettingConfig = (schema?: JsonSchema) => {
  const inferredType = inferSettingType(schema);
  const uiOptions = getSettingUiOptions(schema);
  const config: Record<string, unknown> = {};

  if (inferredType === SettingType.number) {
    if (typeof schema?.minimum === 'number') {
      config.min = schema.minimum;
    }

    if (typeof schema?.maximum === 'number') {
      config.max = schema.maximum;
    }

    if (typeof uiOptions?.step === 'number') {
      config.step = uiOptions.step;
    }
  }

  if (
    inferredType === SettingType.select &&
    getUiWidget(schema) === AUTOCOMPLETE_WIDGET
  ) {
    if (typeof uiOptions?.entity === 'string') {
      config.entity = uiOptions.entity;
    }

    if (typeof uiOptions?.valueKey === 'string') {
      config.idKey = uiOptions.valueKey;
    }

    if (typeof uiOptions?.labelKey === 'string') {
      config.labelKey = uiOptions.labelKey;
    }

    if (typeof uiOptions?.enableEntityAddButton === 'boolean') {
      config.allowCreate = uiOptions.enableEntityAddButton;
    }
  }

  return Object.keys(config).length > 0
    ? (config as Record<string, any>)
    : undefined;
};

const withDefault = (schema: z.ZodTypeAny, value: unknown): z.ZodTypeAny => {
  if (value === undefined) {
    return schema;
  }

  return schema.default(value as never);
};
const buildBaseZodSchema = (schema: JsonSchema): z.ZodTypeAny => {
  const inferredType = inferSettingType(schema);
  const allowsNull = schemaAllowsNull(schema);

  switch (inferredType) {
    case SettingType.text:
    case SettingType.textarea:
    case SettingType.secret: {
      const base = allowsNull ? z.string().nullable() : z.string();

      return withDefault(base, getSettingDefault(schema));
    }
    case SettingType.multiple_text:
    case SettingType.multiple_attachment:
      return withDefault(z.array(z.string()), getSettingDefault(schema) ?? []);
    case SettingType.checkbox: {
      const base = allowsNull ? z.boolean().nullable() : z.boolean();

      return withDefault(base, getSettingDefault(schema));
    }
    case SettingType.number: {
      let base = hasSchemaType(schema, 'integer')
        ? z.number().int()
        : z.number();

      if (typeof schema.minimum === 'number') {
        base = base.min(schema.minimum);
      }

      if (typeof schema.maximum === 'number') {
        base = base.max(schema.maximum);
      }

      const finalSchema = allowsNull ? base.nullable() : base;

      return withDefault(finalSchema, getSettingDefault(schema));
    }
    case SettingType.select: {
      const options = getSettingOptions(schema);

      if (options && options.length > 0) {
        let base: z.ZodTypeAny = z.enum([options[0], ...options.slice(1)] as [
          string,
          ...string[],
        ]);

        if (allowsNull) {
          base = base.nullable();
        }

        const defaultValue = getSettingDefault(schema);

        if (
          (typeof defaultValue === 'string' &&
            options.includes(defaultValue)) ||
          defaultValue === null
        ) {
          return withDefault(base, defaultValue);
        }

        return base;
      }

      const base = allowsNull ? z.string().nullable() : z.string();

      return withDefault(base, getSettingDefault(schema));
    }
    case SettingType.attachment: {
      const base = allowsNull ? z.string().nullable() : z.string();

      return withDefault(base, getSettingDefault(schema));
    }
    default: {
      const typeList = getSchemaTypeList(schema);

      if (typeList.includes('boolean')) {
        return withDefault(z.boolean(), getSettingDefault(schema));
      }

      if (typeList.includes('number') || typeList.includes('integer')) {
        return withDefault(z.number(), getSettingDefault(schema));
      }

      if (typeList.includes('array')) {
        return withDefault(z.array(z.any()), getSettingDefault(schema));
      }

      if (typeList.includes('string')) {
        return withDefault(z.string(), getSettingDefault(schema));
      }

      return withDefault(z.any(), getSettingDefault(schema));
    }
  }
};

export const buildSettingValueZodSchema = (schema?: JsonSchema) => {
  return buildBaseZodSchema(cloneSettingSchema(schema));
};

export const getSettingValidationError = (
  schema: JsonSchema,
  value: SettingValue | undefined,
): string | undefined => {
  const inferredType = inferSettingType(schema);
  const allowsNull = schemaAllowsNull(schema);

  switch (inferredType) {
    case SettingType.text:
    case SettingType.textarea:
      if (typeof value !== 'string' && (!allowsNull || value !== null)) {
        return 'Setting value must be a string.';
      }

      return undefined;
    case SettingType.secret:
      if (typeof value !== 'string') {
        return 'Setting value must be a string.';
      }

      return undefined;
    case SettingType.multiple_text:
      return isStringArray(value)
        ? undefined
        : 'Setting value must be an array of strings.';
    case SettingType.checkbox:
      if (typeof value !== 'boolean' && (!allowsNull || value !== null)) {
        return 'Setting value must be a boolean.';
      }

      return undefined;
    case SettingType.number:
      if (typeof value !== 'number' && (!allowsNull || value !== null)) {
        return 'Setting value must be a number.';
      }
      if (typeof value === 'number') {
        if (typeof schema.minimum === 'number' && value < schema.minimum) {
          return `Setting value must be greater than or equal to ${schema.minimum}.`;
        }

        if (typeof schema.maximum === 'number' && value > schema.maximum) {
          return `Setting value must be less than or equal to ${schema.maximum}.`;
        }
      }

      return undefined;
    case SettingType.select: {
      if (typeof value !== 'string' && (!allowsNull || value !== null)) {
        return 'Setting value must be a string.';
      }

      const options = getSettingOptions(schema);

      if (typeof value === 'string' && options && !options.includes(value)) {
        return 'Setting value must be one of the allowed options.';
      }

      return undefined;
    }
    case SettingType.attachment:
      if (typeof value !== 'string' && value !== null) {
        return 'Setting value must be a string or null.';
      }

      return undefined;
    case SettingType.multiple_attachment:
      return isStringArray(value)
        ? undefined
        : 'Setting value must be an array of attachment ids.';
    default:
      return undefined;
  }
};
