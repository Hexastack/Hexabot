/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

type TSortProps<T> = {
  row1: T;
  row2: T;
  field?: keyof T | 'createdAt';
  order?: 'desc' | 'asc';
};

type TCreatedAt = { createdAt?: string | Date };

const sort = <R extends TCreatedAt, S, T extends TCreatedAt = R & S>({
  row1,
  row2,
  field = 'createdAt',
  order = 'desc',
}: TSortProps<T>) => (order === 'asc' && row1[field] > row2[field] ? 1 : -1);

export const sortRowsBy = <
  R extends TCreatedAt,
  S,
  T extends TCreatedAt = R & S,
>(
  row1: T,
  row2: T,
  field?: keyof T,
  order?: TSortProps<T>['order'],
) => sort({ row1, row2, field, order });
