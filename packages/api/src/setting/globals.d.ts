/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DEFAULT_SETTINGS } from './seeds/setting.seed-model';
import { SettingSeed } from './types';

declare global {
  type TNativeType<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends readonly (infer U)[]
          ? TNativeType<U>[]
          : T extends object
            ? { [K in keyof T]: TNativeType<T[K]> }
            : T;

  type SchemaLike = {
    type?: unknown;
    default?: unknown;
    enum?: readonly string[] | string[];
    items?: unknown;
  };

  type HasNullSchemaType<TSchema extends SchemaLike> = TSchema extends {
    type: readonly unknown[];
  }
    ? Extract<TSchema['type'][number], 'null'> extends never
      ? false
      : true
    : TSchema extends { type: 'null' }
      ? true
      : false;

  type SchemaValueFromType<
    TSchema extends SchemaLike,
    TType = TSchema['type'],
  > = TType extends readonly unknown[]
    ? SchemaValueFromType<TSchema, TType[number]>
    : TType extends 'string'
      ? string
      : TType extends 'number' | 'integer'
        ? number
        : TType extends 'boolean'
          ? boolean
          : TType extends 'null'
            ? null
            : TType extends 'array'
              ? TSchema extends { items: infer TItems extends SchemaLike }
                ? SettingValueFromSchema<{ schema: TItems }>[]
                : unknown[]
              : TType extends 'object'
                ? Record<string, unknown>
                : unknown;

  type SettingValueFromSchema<T extends { schema: SchemaLike }> =
    T['schema'] extends infer TSchema extends SchemaLike
      ? TSchema extends { enum: readonly (infer TOption extends string)[] }
        ? HasNullSchemaType<TSchema> extends true
          ? TOption | null
          : TOption
        : TSchema extends { default: infer TDefault }
          ? [TDefault] extends [null]
            ? SchemaValueFromType<TSchema>
            : TNativeType<TDefault>
          : SchemaValueFromType<TSchema>
      : unknown;

  type SettingValue<K extends { schema: SchemaLike }> =
    SettingValueFromSchema<K>;

  type SettingObject<T extends readonly SettingSeed[]> = {
    [K in T[number] as K['label']]: SettingValue<K>;
  };

  type SettingMapByType<T extends readonly SettingSeed[]> = {
    [K in T[number] as K['label']]: K;
  };

  type SettingTree<T extends readonly SettingSeed[]> = {
    [G in T[number]['group']]: {
      [K in Extract<T[number], { group: G }> as K['label']]: SettingValue<K>;
    };
  };

  interface Settings extends SettingTree<typeof DEFAULT_SETTINGS> {}
}
