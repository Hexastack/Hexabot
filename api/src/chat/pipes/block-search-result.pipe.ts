/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';

import { SearchRankedBlock } from '../repositories/block.repository';

type BlockSearchInput =
  | any[]
  | {
      results: any[];
      total: number;
      page: number;
      limit: number;
    };

export interface BlockSearchResult {
  results: SearchRankedBlock[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class BlockSearchResultPipe
  implements PipeTransform<BlockSearchInput, BlockSearchResult>
{
  // Always return a normalized paginated object
  transform(value: BlockSearchInput): BlockSearchResult {
    const Target = SearchRankedBlock;

    const fullOpts = {
      excludePrefixes: ['_'],
      excludeExtraneousValues: false,
    };

    if (Array.isArray(value)) {
      const instances = plainToInstance(Target, value, fullOpts);
      return {
        results: instances,
        total: instances.length,
        page: 1,
        limit: instances.length,
      };
    }

    const instances = plainToInstance(Target, value.results, fullOpts);
    return {
      results: instances,
      total: value.total,
      page: value.page,
      limit: value.limit,
    };
  }
}
