/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FindManyOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import {
  DtoAction,
  DtoActionConfig,
  DtoTransformerConfig,
  InferActionDto,
} from '../types/dto.types';

import { BaseOrmRepository, FindAllOptions } from './base-orm.repository';

export abstract class BaseOrmSeeder<
  Entity extends BaseOrmEntity,
  TransformerDto extends DtoTransformerConfig,
  ActionDto extends DtoActionConfig,
  OrmRepository extends BaseOrmRepository<
    Entity,
    TransformerDto,
    ActionDto
  > = BaseOrmRepository<Entity, TransformerDto, ActionDto>,
> {
  protected constructor(protected readonly repository: OrmRepository) {}

  async findAll(
    options: FindAllOptions<Entity> = {} as FindAllOptions<Entity>,
  ) {
    return await this.repository.findAll(options);
  }

  async isEmpty(options: FindManyOptions<Entity> = {}): Promise<boolean> {
    const count = await this.repository.count(options);
    return count === 0;
  }

  async seed(
    models: InferActionDto<DtoAction.Create, ActionDto>[],
  ): Promise<boolean> {
    if (await this.isEmpty()) {
      await this.repository.createMany(models);
      return true;
    }
    return false;
  }
}
