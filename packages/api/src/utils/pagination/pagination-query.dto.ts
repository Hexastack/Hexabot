/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { SortOrder } from 'mongoose';

export type QuerySortDto<T> = [string, SortOrder];

export type PageQueryDto<T> = {
  skip: number | undefined;
  limit: number | undefined;
  sort?: QuerySortDto<T>;
};
