/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
