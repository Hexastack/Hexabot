/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DeepPartial, FindManyOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { PageQueryDto } from '../pagination/pagination-query.dto';

import { BaseOrmRepository } from './base-orm.repository';

export abstract class BaseOrmSeeder<
  Entity extends BaseOrmEntity,
  RepositoryType extends BaseOrmRepository<
    Entity,
    any,
    any
  > = BaseOrmRepository<Entity, any, any>,
> {
  protected constructor(protected readonly repository: RepositoryType) {}

  async findAll(pageQuery?: PageQueryDto<Entity>) {
    if (!pageQuery) {
      return await this.repository.findAll();
    }

    const options: FindManyOptions<Entity> = {};

    if (typeof pageQuery.skip === 'number') {
      options.skip = pageQuery.skip;
    }

    if (typeof pageQuery.limit === 'number') {
      options.take = pageQuery.limit;
    }

    if (pageQuery.sort) {
      const [field, direction] = pageQuery.sort;
      if (field) {
        options.order = {
          [field]: (typeof direction === 'string'
            ? direction.toUpperCase()
            : direction >= 0
              ? 'ASC'
              : 'DESC') as 'ASC' | 'DESC',
        } as FindManyOptions<Entity>['order'];
      }
    }

    return await this.repository.find(options);
  }

  async isEmpty(options: FindManyOptions<Entity> = {}): Promise<boolean> {
    const count = await this.repository.count(options);
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
