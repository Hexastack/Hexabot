/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ForbiddenException, Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { CategoryDto } from '../dto/category.dto';
import { Category } from '../schemas/category.schema';
import { BlockService } from '../services/block.service';

@Injectable()
export class CategoryRepository extends BaseRepository<
  Category,
  never,
  never,
  CategoryDto
> {
  private readonly blockService: BlockService;

  constructor(
    @InjectModel(Category.name) readonly model: Model<Category>,
    @Optional() blockService?: BlockService,
  ) {
    super(model, Category);
    this.blockService = blockService!;
  }

  /**
   * Pre-processing logic before deleting a category.
   * It avoids delete a category that contains blocks.
   *
   * @param query - The delete query.
   * @param criteria - The filter criteria for finding blocks to delete.
   */
  async preDelete(
    query: Query<
      DeleteResult,
      Document<Category, any, any>,
      unknown,
      Category,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<Category>,
  ) {
    criteria = query.getQuery();
    const ids = Array.isArray(criteria._id?.$in)
      ? criteria._id.$in
      : Array.isArray(criteria._id)
        ? criteria._id
        : [criteria._id];

    for (const id of ids) {
      const associatedBlocks = await this.blockService.findOne({
        category: id,
      });
      if (associatedBlocks) {
        const category = await this.findOne({ _id: id });
        throw new ForbiddenException(
          `Category ${category?.label || id} has blocks associated with it`,
        );
      }
    }
  }
}
