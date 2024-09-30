/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { PipeTransform } from '@nestjs/common';

import { config } from '@/config';

import { PageQueryDto } from './pagination-query.dto';

const sortTypes = ['asc', 'desc'];

export class PageQueryPipe<T>
  implements
    PipeTransform<
      { skip: string; limit: string; sort: string },
      PageQueryDto<T>
    >
{
  transform(value: { skip: string; limit: string; sort: string }) {
    const skip = parseInt(value.skip) > -1 ? parseInt(value.skip) : 0;
    const limit =
      parseInt(value.limit) > 0
        ? parseInt(value.limit)
        : config.pagination.limit;
    const [sortName = 'createdAt', sortType = 'desc'] =
      value.sort?.split(' ') || [];

    return {
      skip,
      limit,
      sort: [sortName, sortTypes.includes(sortType) ? sortType : 'desc'],
    } as PageQueryDto<T>;
  }
}
