/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { FindManyOptions, FindOneOptions } from 'typeorm';

import { PageQueryDto } from '../pagination/pagination-query.dto';
import {
  DtoAction,
  DtoActionConfig,
  DtoTransformer,
  DtoTransformerConfig,
  InferActionDto,
  InferTransformDto,
} from '../types/dto.types';
import { TFilterQuery } from '../types/filter.types';

import {
  BaseOrmRepository,
  FindAllOptions,
  SortTuple,
  UpdateOneOptions,
} from './base-orm.repository';
import { DeleteResult } from './base-repository';

export abstract class BaseOrmService<
  Entity extends { id: string },
  TransformerDto extends DtoTransformerConfig,
  ActionDto extends DtoActionConfig,
  OrmRepository extends BaseOrmRepository<
    Entity,
    TransformerDto,
    ActionDto
  > = BaseOrmRepository<Entity, TransformerDto, ActionDto>,
> {
  readonly eventEmitter: EventEmitter2 | undefined;

  protected constructor(protected readonly repository: OrmRepository) {
    this.eventEmitter = repository.getEventEmitter();
  }

  getRepository(): OrmRepository {
    return this.repository;
  }

  canPopulate(populate: string[]): boolean {
    return this.repository.canPopulate(populate);
  }

  /**
   * @deprecated Use find(options) with TypeORM FindManyOptions instead.
   */
  async find(
    filter: TFilterQuery<Entity>,
    pageQuery?: PageQueryDto<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]>;

  async find(
    options?: FindManyOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]>;

  async find(
    filterOrOptions: TFilterQuery<Entity> | FindManyOptions<Entity> = {},
    pageQuery?: PageQueryDto<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    return this.repository.isFindOptions(filterOrOptions)
      ? await this.repository.find(filterOrOptions)
      : await this.repository.find(filterOrOptions, pageQuery);
  }

  /**
   * @deprecated Use findOneAndPopulate(options) with TypeORM FindOneOptions instead.
   */
  async findAndPopulate(
    criteria: TFilterQuery<Entity>,
    pageQuery?: PageQueryDto<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]>;

  async findAndPopulate(
    options: FindManyOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]>;

  async findAndPopulate(
    filterOrOptions: TFilterQuery<Entity> | FindManyOptions<Entity> = {},
    pageQuery?: PageQueryDto<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]> {
    return this.repository.isFindOptions(filterOrOptions)
      ? await this.repository.findAndPopulate(filterOrOptions)
      : await this.repository.findAndPopulate(filterOrOptions, pageQuery);
  }

  /**
   * @deprecated Use findAll(options) with TypeORM FindManyOptions (without `where`) instead.
   */
  async findAll(
    sort?: SortTuple<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]>;

  async findAll(
    options?: FindAllOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]>;

  async findAll(
    sortOrOptions?: SortTuple<Entity> | FindAllOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    return this.repository.isFindOptions(sortOrOptions as any)
      ? await this.repository.findAll(sortOrOptions as FindAllOptions<Entity>)
      : await this.repository.findAll(sortOrOptions as SortTuple<Entity>);
  }

  /**
   * @deprecated Use findAllAndPopulate(options) with TypeORM FindManyOptions instead.
   */
  async findAllAndPopulate(
    sortOrOptions?: SortTuple<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]>;

  async findAllAndPopulate(
    sortOrOptions?: FindAllOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]>;

  async findAllAndPopulate(
    sortOrOptions?: SortTuple<Entity> | FindAllOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]> {
    return this.repository.isFindOptions(sortOrOptions as any)
      ? await this.repository.findAllAndPopulate(
          sortOrOptions as FindAllOptions<Entity>,
        )
      : await this.repository.findAllAndPopulate(
          sortOrOptions as SortTuple<Entity>,
        );
  }

  async count(filter: TFilterQuery<Entity> = {}): Promise<number> {
    return await this.repository.count(filter);
  }

  /**
   * @deprecated Use findOne(options) with TypeORM FindOneOptions instead.
   */
  async findOne(
    criteria: string | TFilterQuery<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto> | null>;

  async findOne(
    options: FindOneOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto> | null>;

  async findOne(
    criteriaOrOptions: string | TFilterQuery<Entity> | FindOneOptions<Entity>,
  ): Promise<InferTransformDto<
    DtoTransformer.PlainCls,
    TransformerDto
  > | null> {
    return typeof criteriaOrOptions === 'string' ||
      !this.repository.isFindOptions(criteriaOrOptions)
      ? await this.repository.findOne(criteriaOrOptions)
      : await this.repository.findOne(criteriaOrOptions);
  }

  /**
   * @deprecated Use findOneAndPopulate(options) with TypeORM FindOneOptions instead.
   */
  async findOneAndPopulate(
    criteria: string | TFilterQuery<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto> | null>;

  async findOneAndPopulate(
    options: FindOneOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto> | null>;

  async findOneAndPopulate(
    criteria: string | TFilterQuery<Entity> | FindOneOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto> | null> {
    return typeof criteria === 'string' ||
      !this.repository.isFindOptions(criteria)
      ? await this.repository.findOneAndPopulate(criteria)
      : await this.repository.findOneAndPopulate(criteria);
  }

  async create(
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    return await this.repository.create(payload);
  }

  async createMany(
    payloads: InferActionDto<DtoAction.Create, ActionDto>[],
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    return await this.repository.createMany(payloads);
  }

  /**
   * @deprecated Use updateOne(options, payload) with TypeORM FindOneOptions instead.
   */
  async updateOne(
    criteria: string | TFilterQuery<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>>;

  async updateOne(
    options: FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    opt?: UpdateOneOptions,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>>;

  async updateOne(
    criteriaOrOptions: string | TFilterQuery<Entity> | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    opts?: UpdateOneOptions,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    return typeof criteriaOrOptions === 'string' ||
      !this.repository.isFindOptions(criteriaOrOptions)
      ? await this.repository.updateOne(criteriaOrOptions, payload, opts)
      : await this.repository.updateOne(criteriaOrOptions, payload);
  }

  /**
   * @deprecated Use findOneOrCreate(options, payload) with TypeORM FindOneOptions instead.
   */
  async findOneOrCreate(
    criteria: string | TFilterQuery<Entity>,
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>>;

  async findOneOrCreate(
    options: FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>>;

  async findOneOrCreate(
    criteriaOrOptions: string | TFilterQuery<Entity> | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    return typeof criteriaOrOptions === 'string' ||
      !this.repository.isFindOptions(criteriaOrOptions)
      ? await this.repository.findOneOrCreate(criteriaOrOptions, payload)
      : await this.repository.findOneOrCreate(criteriaOrOptions, payload);
  }

  /**
   * @deprecated Use deleteMany(options) with TypeORM FindManyOptions instead.
   */
  async deleteMany(filter: TFilterQuery<Entity>): Promise<DeleteResult>;

  async deleteMany(options?: FindManyOptions<Entity>): Promise<DeleteResult>;

  async deleteMany(
    filterOrOptions: TFilterQuery<Entity> | FindManyOptions<Entity> = {},
  ): Promise<DeleteResult> {
    return this.repository.isFindOptions(filterOrOptions)
      ? await this.repository.deleteMany(filterOrOptions)
      : await this.repository.deleteMany(filterOrOptions);
  }

  /**
   * @deprecated Use deleteOne(options) with TypeORM FindOneOptions instead.
   */
  async deleteOne(
    criteria: string | TFilterQuery<Entity>,
  ): Promise<DeleteResult>;

  async deleteOne(options: FindOneOptions<Entity>): Promise<DeleteResult>;

  async deleteOne(
    criteriaOrOptions: string | TFilterQuery<Entity> | FindOneOptions<Entity>,
  ): Promise<DeleteResult> {
    return typeof criteriaOrOptions === 'string' ||
      !this.repository.isFindOptions(criteriaOrOptions)
      ? await this.repository.deleteOne(criteriaOrOptions)
      : await this.repository.deleteOne(criteriaOrOptions);
  }
}
