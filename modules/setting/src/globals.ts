/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DEFAULT_SETTINGS } from './seeds/setting.seed-model';
import { SettingByType, SettingType } from './types';

type SettingSeedLike = {
  group: string;
  label: string;
  type: SettingType;
  value: unknown;
  options?: string[];
};

declare global {
  type TNativeType<T> = T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
        : T extends Array<infer U>
          ? TNativeType<U>[]
          : T extends object
            ? { [K in keyof T]: TNativeType<T[K]> }
            : T;

  type SettingValue<K extends SettingSeedLike> =
    K['type'] extends SettingType.select
      ? NonNullable<K['options']>[number]
      : TNativeType<K['value']>;

  type SettingObject<T extends readonly SettingSeedLike[]> = {
    [K in T[number] as K['label']]: SettingValue<K>;
  };

  type SettingMapByType<T extends readonly SettingSeedLike[]> = {
    [K in T[number] as K['label']]: SettingByType<K['type']>;
  };

  type SettingTree<T extends readonly SettingSeedLike[]> = {
    [G in T[number] as G['group']]: {
      [K in T[number] as K['label']]: SettingValue<K>;
    };
  };
  interface Settings extends SettingTree<typeof DEFAULT_SETTINGS> {}
}

export {};
