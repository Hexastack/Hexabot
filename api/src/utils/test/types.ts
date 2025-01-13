/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BaseSchema } from '../generics/base-schema';

export type TOptionalPropertyOf<T> = Exclude<
  {
    [K in keyof T]: T extends Record<K, T[K]> ? never : K;
  }[keyof T],
  undefined
>;

//fixtures types
export type TFixtures<T> = Omit<T, keyof BaseSchema> & {
  createdAt?: BaseSchema['createdAt'];
};

export type TFixturesDefaultValues<T, S = TFixtures<T>> = {
  [key in TOptionalPropertyOf<S>]?: S[key];
} & { createdAt?: BaseSchema['createdAt'] };

export type TOptionalPropertyFrom<O extends object, O1 extends object> = Pick<
  O1,
  Exclude<keyof O1, keyof O>
> &
  Pick<O, Exclude<keyof O, keyof O1>>;

export type OptionalProperties<T, K extends keyof T> = Omit<
  T,
  K | keyof BaseSchema
> &
  Partial<Pick<T, K>>;

export type FixturesTypeBuilder<
  S extends object,
  D extends object,
  DO = TFixturesDefaultValues<D>,
  U = Partial<TFixtures<TOptionalPropertyFrom<D, S>>>,
> = {
  defaultValues: DO & U;
  values: OptionalProperties<S, keyof S & keyof (DO & U)>;
};
