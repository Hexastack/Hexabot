/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmSeeder } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';

import { CategoryDtoConfig, CategoryTransformerDto } from '../dto/category.dto';
import { CategoryOrmEntity } from '../entities/category.entity';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class CategorySeeder extends BaseOrmSeeder<
  CategoryOrmEntity,
  CategoryTransformerDto,
  CategoryDtoConfig
> {
  constructor(private readonly categoryRepository: CategoryRepository) {
    super(categoryRepository);
  }
}
