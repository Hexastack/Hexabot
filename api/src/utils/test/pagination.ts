/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { config } from '@/config';

import { PageQueryDto } from '../pagination/pagination-query.dto';

export const getPageQuery = <T>(
  props?: Partial<PageQueryDto<T>>,
): PageQueryDto<T> => ({
  skip: 0,
  limit: config.pagination.limit,
  sort: ['createdAt', 'desc'],
  ...props,
});
