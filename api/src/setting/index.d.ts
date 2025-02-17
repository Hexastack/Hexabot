/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { SettingType } from '@/setting/schemas/types';

import { SettingByType } from './schemas/types';
import { DEFAULT_SETTINGS } from './seeds/setting.seed-model';

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

  type SettingValue<K> = K['type'] extends SettingType.select
    ? K['options'][number]
    : TNativeType<K['value']>;

  type SettingObject<
    T extends Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>[],
  > = {
    [K in T[number] as K['label']]: SettingValue<K>;
  };

  type SettingMapByType<
    T extends Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>[],
  > = {
    [K in T[number] as K['label']]: SettingByType<K['type']>;
  };

  type SettingTree<
    T extends Omit<Setting, 'id' | 'createdAt' | 'updatedAt'>[],
  > = {
    [G in T[number] as G['group']]: {
      [K in T[number] as K['label']]: SettingValue<K>;
    };
  };

  interface Settings extends SettingTree<typeof DEFAULT_SETTINGS> {}
}
