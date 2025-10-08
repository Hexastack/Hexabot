/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { SortOrder } from 'mongoose';

import { BaseSchema } from '../generics/base-schema';

export type QuerySortDto<T> = [
  Exclude<keyof T | keyof BaseSchema | '_id', 'id'>,
  SortOrder,
];

export type PageQueryDto<T> = {
  skip: number | undefined;
  limit: number | undefined;
  sort?: QuerySortDto<T>;
};
