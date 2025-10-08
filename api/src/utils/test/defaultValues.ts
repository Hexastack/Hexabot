/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { getDelayedDate } from './date';
import { TFixtures, TFixturesDefaultValues } from './types';

export const getFixturesWithDefaultValues = <T, S = TFixtures<T>>({
  fixtures,
  defaultValues = {},
}: {
  fixtures: S[];
  defaultValues?: TFixturesDefaultValues<T>;
}): S[] =>
  fixtures.map((fixture, index) => ({
    ...defaultValues,
    ...fixture,
    createdAt: defaultValues.hasOwnProperty('createdAt')
      ? defaultValues.createdAt
      : getDelayedDate(index),
  }));
