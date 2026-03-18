/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { Setting, SettingCreateDto } from '../dto/setting.dto';

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
