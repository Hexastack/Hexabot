/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { PipeTransform } from '@nestjs/common';

import { config } from '@/config';

import { PageQueryDto } from './pagination-query.dto';

const sortTypes = ['asc', 'desc'];

export type PageQueryParams = { skip?: string; limit?: string; sort?: string };

export class PageQueryPipe<T>
  implements PipeTransform<PageQueryParams, PageQueryDto<T>>
{
  transform(value: PageQueryParams) {
    let skip: number | undefined = undefined;
    let limit: number | undefined = undefined;
    if (value && 'limit' in value) {
      skip = value.skip && parseInt(value.skip) > -1 ? parseInt(value.skip) : 0;
      limit =
        value.limit && parseInt(value.limit) > 0
          ? parseInt(value.limit)
          : config.pagination.limit;
    }
    const [sortName = 'createdAt', sortType = 'desc'] =
      value.sort?.split(' ') || [];

    return {
      skip,
      limit,
      sort: [sortName, sortTypes.includes(sortType) ? sortType : 'desc'],
    } as PageQueryDto<T>;
  }
}
