/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JSONSchema7 as JsonSchema } from 'json-schema';
import { z } from 'zod';

import { Setting, SettingCreateDto } from '../dto/setting.dto';
import { SettingSchema } from '../types';

import {
  buildSettingValueZodSchema,
  cloneSettingSchema,
  getSettingDefault,
  withSettingDefault,
} from './setting-schema-definition.utils';

export type SettingSchemaSource = Pick<
  SettingCreateDto,
  'group' | 'subgroup' | 'label' | 'schema' | 'weight' | 'translatable'
>;

export type SettingSchemaCatalogEntry = {
  group: string;
  schema: JsonSchema;
  values: Record<string, unknown>;
};

const sortSettingSchemaSources = <T extends { label: string; weight?: number }>(
  settings: readonly T[],
) => {
  return [...settings].sort((left, right) => {
    const leftWeight = left.weight ?? Number.MAX_SAFE_INTEGER;
    const rightWeight = right.weight ?? Number.MAX_SAFE_INTEGER;

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    return left.label.localeCompare(right.label);
  });
};
const withSchemaTitle = (schema: JsonSchema, title: string): SettingSchema => {
  const next = cloneSettingSchema(schema);

  if (typeof next.title !== 'string' || next.title.length === 0) {
    next.title = title;
  }

  return next;
};

export const buildSettingGroupZodSchema = (
  settings: readonly SettingSchemaSource[],
) => {
  const sortedSettings = sortSettingSchemaSources(settings);
  const shape = Object.fromEntries(
    sortedSettings.map((setting) => [
      setting.label,
      buildSettingValueZodSchema(setting.schema),
    ]),
  );

  return z.strictObject(shape);
};

export const buildSettingGroupJsonSchema = (
  settings: readonly SettingSchemaSource[],
): JsonSchema => {
  const sortedSettings = sortSettingSchemaSources(settings);

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    properties: Object.fromEntries(
      sortedSettings.map((setting) => [
        setting.label,
        withSchemaTitle(setting.schema, setting.label),
      ]),
    ),
    additionalProperties: false,
  } satisfies JsonSchema;
};

export const buildSettingGroupValues = (
  settings: readonly SettingSchemaSource[],
) => {
  return Object.fromEntries(
    sortSettingSchemaSources(settings).map((setting) => [
      setting.label,
      getSettingDefault(setting.schema),
    ]),
  );
};

export const groupSettingSchemaSources = <T extends SettingSchemaSource>(
  settings: readonly T[],
) => {
  return sortSettingSchemaSources(settings).reduce(
    (acc, setting) => {
      const group = acc[setting.group] ?? [];

      group.push(setting);
      acc[setting.group] = group;

      return acc;
    },
    {} as Record<string, T[]>,
  );
};

export const mergeSettingGroupSources = (
  defaults: readonly SettingSchemaSource[] = [],
  current: readonly Setting[] = [],
) => {
  const currentByLabel = new Map(
    current.map((setting) => [setting.label, setting]),
  );
  const merged = defaults.map((setting) => {
    const existing = currentByLabel.get(setting.label);

    if (!existing) {
      return {
        ...setting,
        schema: cloneSettingSchema(setting.schema),
      };
    }

    return {
      group: existing.group || setting.group,
      subgroup: existing.subgroup ?? setting.subgroup,
      label: existing.label || setting.label,
      schema: withSettingDefault(
        setting.schema,
        existing.value !== undefined
          ? existing.value
          : getSettingDefault(setting.schema),
      ),
      weight: existing.weight ?? setting.weight,
      translatable: existing.translatable ?? setting.translatable,
    };
  });
  const knownLabels = new Set(defaults.map((setting) => setting.label));
  const extras = current
    .filter((setting) => !knownLabels.has(setting.label))
    .map((setting) => ({
      group: setting.group,
      subgroup: setting.subgroup,
      label: setting.label,
      schema: cloneSettingSchema(setting.schema),
      weight: setting.weight,
      translatable: setting.translatable,
    }));

  return sortSettingSchemaSources([...merged, ...extras]);
};
