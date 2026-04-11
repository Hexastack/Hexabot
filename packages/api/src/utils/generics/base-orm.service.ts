/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject } from '@nestjs/common';
import { FindManyOptions, FindOneOptions } from 'typeorm';
import { DeleteResult } from 'typeorm/driver/mongodb/typings';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LoggerService } from '@/logger/logger.service';

import {
  InferCreateDto,
  InferFull,
  InferPlain,
  InferUpdateDto,
  TEntityDto,
} from '../types/dto.types';

import {
  BaseOrmRepository,
  FindAllOptions,
  UpdateOneOptions,
} from './base-orm.repository';

export abstract class BaseOrmService<
  Entity extends BaseOrmEntity<TEntityDto<Entity>>,
> {
  protected constructor(
    protected readonly repository: BaseOrmRepository<Entity>,
  ) {}

  get eventEmitter() {
    return this.repository.getEventEmitter();
  }

  @Inject(LoggerService)
  readonly logger: LoggerService;

  getRepository(): BaseOrmRepository<Entity> {
    return this.repository;
  }

  canPopulate(populate: string[]): boolean {
    return this.repository.canPopulate(populate);
  }

  async find(options?: FindManyOptions<Entity>): Promise<InferPlain<Entity>[]> {
    return await this.repository.find(options);
  }

  async findAndPopulate(
    options?: FindManyOptions<Entity>,
  ): Promise<InferFull<Entity>[]> {
    return await this.repository.findAndPopulate(options);
  }

  async findAll(
    options?: FindAllOptions<Entity>,
  ): Promise<InferPlain<Entity>[]> {
    return await this.repository.findAll(options);
  }

  async findAllAndPopulate(
    options?: FindAllOptions<Entity>,
  ): Promise<InferFull<Entity>[]> {
    return await this.repository.findAllAndPopulate(options);
  }

  async count(options?: FindManyOptions<Entity>): Promise<number> {
    return await this.repository.count(options);
  }

  async findOne(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferPlain<Entity> | null> {
    return await this.repository.findOne(idOrOptions);
  }

  async findOneAndPopulate(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferFull<Entity> | null> {
    return await this.repository.findOneAndPopulate(idOrOptions);
  }

  async create(payload: InferCreateDto<Entity>): Promise<InferPlain<Entity>> {
    return await this.repository.create(payload);
  }

  async createMany(
    payloads: InferCreateDto<Entity>[],
  ): Promise<InferPlain<Entity>[]> {
    return await this.repository.createMany(payloads);
  }

  async updateOne(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferUpdateDto<Entity>,
    options?: UpdateOneOptions,
  ): Promise<InferPlain<Entity>> {
    return await this.repository.updateOne(idOrOptions, payload, options);
  }

  async updateMany(
    options: FindManyOptions<Entity>,
    payload: InferUpdateDto<Entity>,
  ): Promise<InferPlain<Entity>[]> {
    return await this.repository.updateMany(options, payload);
  }

  async findOneOrCreate(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferCreateDto<Entity>,
  ): Promise<InferPlain<Entity>> {
    return await this.repository.findOneOrCreate(idOrOptions, payload);
  }

  async deleteMany(options?: FindManyOptions<Entity>): Promise<DeleteResult> {
    return await this.repository.deleteMany(options);
  }

  async deleteOne(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<DeleteResult> {
    return await this.repository.deleteOne(idOrOptions);
  }
}
