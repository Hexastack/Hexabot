/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Category,
  CategoryDtoConfig,
  CategoryFull,
  CategoryTransformerDto,
} from '../dto/category.dto';
import { CategoryOrmEntity } from '../entities/category.entity';

@Injectable()
export class CategoryRepository extends BaseOrmRepository<
  CategoryOrmEntity,
  CategoryTransformerDto,
  CategoryDtoConfig
> {
  constructor(
    @InjectRepository(CategoryOrmEntity)
    repository: Repository<CategoryOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: Category,
      FullCls: CategoryFull,
    });
  }
}
