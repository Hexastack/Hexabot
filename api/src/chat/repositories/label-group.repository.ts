/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { LabelGroupDto } from '../dto/label-group.dto';
import { LabelGroup } from '../schemas/label-group.schema';
import { LabelService } from '../services/label.service';

@Injectable()
export class LabelGroupRepository extends BaseRepository<
  LabelGroup,
  never,
  never,
  LabelGroupDto
> {
  constructor(
    @InjectModel(LabelGroup.name) readonly model: Model<LabelGroup>,
    private readonly labelService: LabelService,
  ) {
    super(model, LabelGroup);
  }

  /**
   * Reset all related labels group to `null` to ensure consistency.
   *
   * @param query - The delete query.
   * @param criteria - The filter criteria for finding groups to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<LabelGroup, any, any>,
      unknown,
      LabelGroup,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<LabelGroup>,
  ) {
    const groups = await this.find(criteria);

    await this.labelService.updateMany(
      {
        group: { $in: groups.map(({ id }) => id) },
      },
      { group: null },
    );
  }
}
