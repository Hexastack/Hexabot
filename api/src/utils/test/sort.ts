/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
