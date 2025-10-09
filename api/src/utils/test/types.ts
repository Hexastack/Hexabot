/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
