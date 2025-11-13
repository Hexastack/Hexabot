/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmService } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';

import { CategoryDtoConfig, CategoryTransformerDto } from '../dto/category.dto';
import { CategoryOrmEntity } from '../entities/category.entity';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class CategoryService extends BaseOrmService<
  CategoryOrmEntity,
  CategoryTransformerDto,
  CategoryDtoConfig
> {
  constructor(readonly repository: CategoryRepository) {
    super(repository);
  }
}
