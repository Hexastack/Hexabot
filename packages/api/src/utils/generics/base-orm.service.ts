/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DeepPartial } from 'typeorm';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';
import { TFilterQuery } from '../types/filter.types';

import { BaseOrmRepository, UpdateOneOptions } from './base-orm.repository';
import { DeleteResult } from './base-repository';

export abstract class BaseOrmService<
  Entity extends { id: string },
  RepositoryType extends BaseOrmRepository<Entity> = BaseOrmRepository<Entity>,
> {
  protected constructor(protected readonly repository: RepositoryType) {}

  getRepository(): RepositoryType {
    return this.repository;
  }

  async find(
    filter: TFilterQuery<Entity> = {},
    pageQuery?: PageQueryDto<Entity>,
  ): Promise<Entity[]> {
    return await this.repository.find(filter, pageQuery);
  }

  async findAll(sort?: QuerySortDto<Entity>): Promise<Entity[]> {
    return await this.repository.findAll(sort);
  }

  async count(filter: TFilterQuery<Entity> = {}): Promise<number> {
    return await this.repository.count(filter);
  }

  async findOne(
    criteria: string | TFilterQuery<Entity>,
  ): Promise<Entity | null> {
    return await this.repository.findOne(criteria);
  }

  async create(payload: DeepPartial<Entity>): Promise<Entity> {
    return await this.repository.create(payload);
  }

  async createMany(payloads: DeepPartial<Entity>[]): Promise<Entity[]> {
    return await this.repository.createMany(payloads);
  }

  async updateById(
    id: string,
    payload: DeepPartial<Entity>,
  ): Promise<Entity | null> {
    return await this.repository.update(id, payload);
  }

  async updateOne(
    criteria: string | TFilterQuery<Entity>,
    payload: DeepPartial<Entity>,
    options?: UpdateOneOptions,
  ): Promise<Entity> {
    return await this.repository.updateOne(criteria, payload, options);
  }

  async findOneOrCreate(
    criteria: string | TFilterQuery<Entity>,
    payload: DeepPartial<Entity>,
  ): Promise<Entity> {
    return await this.repository.findOneOrCreate(criteria, payload);
  }

  async deleteMany(filter: TFilterQuery<Entity>): Promise<DeleteResult> {
    return await this.repository.deleteMany(filter);
  }

  async deleteOne(
    criteria: string | TFilterQuery<Entity>,
  ): Promise<DeleteResult> {
    return await this.repository.deleteOne(criteria);
  }
}
