/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { I18nService } from '@/i18n/services/i18n.service';
import { isPlainObject } from '@/utils/helpers/object';

type LocalizableSchemaMetadataOptions = {
  i18n: I18nService;
  ns: string;
  lang?: string;
};

const LOCALIZABLE_SCHEMA_METADATA_KEYS = new Set(['title', 'description']);
const translateMetadataString = (
  value: string,
  { i18n, ns, lang }: LocalizableSchemaMetadataOptions,
): string => {
  return i18n.t(value, {
    ns,
    ...(lang ? { lang } : {}),
    defaultValue: value,
  });
};
const localizeNode = (
  input: unknown,
  options: LocalizableSchemaMetadataOptions,
): unknown => {
  if (Array.isArray(input)) {
    return input.map((entry) => localizeNode(entry, options));
  }

  if (!isPlainObject(input)) {
    return input;
  }

  return Object.entries(input).reduce<Record<string, unknown>>(
    (acc, [key, value]) => {
      if (
        LOCALIZABLE_SCHEMA_METADATA_KEYS.has(key) &&
        typeof value === 'string'
      ) {
        acc[key] = translateMetadataString(value, options);

        return acc;
      }

      acc[key] = localizeNode(value, options);

      return acc;
    },
    {},
  );
};

export const localizeSchemaMetadata = <T>(
  schema: T,
  options: LocalizableSchemaMetadataOptions,
): T => {
  return localizeNode(schema, options) as T;
};
