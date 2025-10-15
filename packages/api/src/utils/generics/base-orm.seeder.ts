/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DeepPartial } from 'typeorm';

import { PageQueryDto } from '../pagination/pagination-query.dto';
import { TFilterQuery } from '../types/filter.types';

import { BaseOrmRepository } from './base-orm.repository';

export abstract class BaseOrmSeeder<
  Entity extends { id: string },
  RepositoryType extends BaseOrmRepository<Entity> = BaseOrmRepository<Entity>,
> {
  protected constructor(protected readonly repository: RepositoryType) {}

  async findAll(pageQuery?: PageQueryDto<Entity>): Promise<Entity[]> {
    if (pageQuery) {
      return await this.repository.find({}, pageQuery);
    }
    return await this.repository.findAll();
  }

  async isEmpty(filter: TFilterQuery<Entity> = {}): Promise<boolean> {
    const count = await this.repository.count(filter);
    return count === 0;
  }

  async seed(models: DeepPartial<Entity>[]): Promise<boolean> {
    if (await this.isEmpty()) {
      await this.repository.createMany(models);
      return true;
    }
    return false;
  }
}
