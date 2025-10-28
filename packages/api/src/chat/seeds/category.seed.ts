/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseSeeder } from '@/utils/generics/base-seeder';

import { Category, CategoryDto } from '../dto/category.dto';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class CategorySeeder extends BaseSeeder<
  Category,
  never,
  never,
  CategoryDto
> {
  constructor(private readonly categoryRepository: CategoryRepository) {
    super(categoryRepository);
  }
}
