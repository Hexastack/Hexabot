/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { ForbiddenException, Injectable } from '@nestjs/common';
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
  constructor(
    @InjectModel(Category.name) readonly model: Model<Category>,
    private readonly blockService: BlockService,
  ) {
    super(model, Category);
  }

  /**
   * Pre-processing logic before deleting a category.
   * It avoids delete a category that contains blocks.
   *
   * @param query - The delete query.
   * @param criteria - The filter criteria for finding blocks to delete.
   */
  async preDelete(
    _query: Query<
      DeleteResult,
      Document<Category, any, any>,
      unknown,
      Category,
      'deleteOne' | 'deleteMany'
    >,
    criteria: TFilterQuery<Category>,
  ) {
    if (criteria._id) {
      const block = await this.blockService.findOneAndPopulate({
        category: criteria._id,
      });

      if (block) {
        throw new ForbiddenException(
          `Category ${block.category?.label} has at least one associated block`,
        );
      }
    } else {
      throw new Error('Attempted to delete category using unknown criteria');
    }
  }
}
