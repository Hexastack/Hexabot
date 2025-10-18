/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ConflictException, Inject } from '@nestjs/common';
import { ClassTransformOptions } from 'class-transformer';
import { MongoError } from 'mongodb';
import { UpdateQuery } from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import {
  TFilterQuery,
  TFlattenOption,
  TProjectionType,
  TQueryOptions,
} from '@/utils/types/filter.types';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';
import { DtoAction, DtoActionConfig, InferActionDto } from '../types/dto.types';

import { BaseRepository } from './base-repository';
import { BaseSchema } from './base-schema';

export abstract class BaseService<
  T extends BaseSchema,
  P extends string = never,
  TFull extends Omit<T, P> = never,
  Dto extends DtoActionConfig = object,
  U extends Omit<T, keyof BaseSchema> = Omit<T, keyof BaseSchema>,
> {
  eventEmitter: typeof this.repository.eventEmitter;

  @Inject(LoggerService)
  readonly logger: LoggerService;

  constructor(protected readonly repository: BaseRepository<T, P, TFull, Dto>) {
    this.eventEmitter = repository.eventEmitter;
  }

  getRepository() {
    return this.repository;
  }

  canPopulate(populate: string[]): boolean {
    return this.repository.canPopulate(populate);
  }

  async findOne(
    criteria: string | TFilterQuery<T>,
    options?: ClassTransformOptions,
    projection?: TProjectionType<T>,
  ): Promise<T | null> {
    return await this.repository.findOne(criteria, options, projection);
  }

  async findOneAndPopulate(
    criteria: string | TFilterQuery<T>,
    projection?: TProjectionType<T>,
  ) {
    return await this.repository.findOneAndPopulate(criteria, projection);
  }

  async find(
    filter: TFilterQuery<T>,
    pageQuery?: PageQueryDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<T[]>;

  /**
   * @deprecated
   */
  async find(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<T[]>;

  async find(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T> | PageQueryDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<T[]> {
    if (Array.isArray(pageQuery))
      return await this.repository.find(filter, pageQuery, projection);

    return await this.repository.find(filter, pageQuery, projection);
  }

  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: PageQueryDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<TFull[]>;

  /**
   * @deprecated
   */
  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<TFull[]>;

  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T> | PageQueryDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<TFull[]> {
    if (Array.isArray(pageQuery))
      return await this.repository.findAndPopulate(
        filters,
        pageQuery,
        projection,
      );

    return await this.repository.findAndPopulate(
      filters,
      pageQuery,
      projection,
    );
  }

  async findAll(sort?: QuerySortDto<T>): Promise<T[]> {
    return await this.repository.findAll(sort);
  }

  async findAllAndPopulate(sort?: QuerySortDto<T>): Promise<TFull[]> {
    return await this.repository.findAllAndPopulate(sort);
  }

  /**
   * @deprecated
   */
  async findPage(
    filters: TFilterQuery<T>,
    pageQueryDto: PageQueryDto<T>,
  ): Promise<T[]> {
    return await this.repository.findPage(filters, pageQueryDto);
  }

  /**
   * @deprecated
   */
  async findPageAndPopulate(
    filters: TFilterQuery<T>,
    pageQueryDto: PageQueryDto<T>,
  ): Promise<TFull[]> {
    return await this.repository.findPageAndPopulate(filters, pageQueryDto);
  }

  async countAll(): Promise<number> {
    return await this.repository.countAll();
  }

  async count(criteria?: TFilterQuery<T>): Promise<number> {
    return await this.repository.count(criteria);
  }

  async create(dto: InferActionDto<DtoAction.Create, Dto, U>): Promise<T> {
    try {
      return await this.repository.create(dto);
    } catch (error) {
      if (error instanceof MongoError && error.code === 11000) {
        throw new ConflictException(
          'Duplicate key error: element already exists',
        );
      }
      throw error;
    }
  }

  async findOneOrCreate(
    criteria: string | TFilterQuery<T>,
    dto: InferActionDto<DtoAction.Create, Dto, U>,
  ): Promise<T> {
    const result = await this.findOne(criteria);
    if (!result) {
      return await this.create(dto);
    }
    return result;
  }

  async createMany(
    dtoArray: InferActionDto<DtoAction.Create, Dto, U>[],
  ): Promise<T[]> {
    return await this.repository.createMany(dtoArray);
  }

  async updateOne(
    criteria: string | TFilterQuery<T>,
    dto: InferActionDto<DtoAction.Update, Dto, Partial<U>>,
    options?: TQueryOptions<Partial<U>>,
  ): Promise<T> {
    try {
      const payload = dto as UpdateQuery<
        InferActionDto<DtoAction.Update, Dto, unknown>
      >;
      return await this.repository.updateOne(criteria, payload, options);
    } catch (error) {
      if (error instanceof MongoError && error.code === 11000) {
        throw new ConflictException(
          'Duplicate key error: element already exists',
        );
      }
      throw error;
    }
  }

  async updateMany(
    filter: TFilterQuery<T>,
    dto: Partial<U>,
    options?: TFlattenOption,
  ) {
    return await this.repository.updateMany(filter, dto, options);
  }

  async deleteOne(criteria: string | TFilterQuery<T>) {
    return await this.repository.deleteOne(criteria);
  }

  async deleteMany(filter: TFilterQuery<T>) {
    return await this.repository.deleteMany(filter);
  }
}
