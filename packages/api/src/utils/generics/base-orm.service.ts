/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject } from '@nestjs/common';
import { FindManyOptions, FindOneOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LoggerService } from '@/logger/logger.service';

import {
  DtoAction,
  DtoActionConfig,
  EntityDto,
  InferActionDto,
  InferDto,
  InferTransformDto,
} from '../types/dto.types';

import {
  BaseOrmRepository,
  DeleteResult,
  FindAllOptions,
  UpdateOneOptions,
} from './base-orm.repository';

export abstract class BaseOrmService<
  Entity extends BaseOrmEntity<EntityDto<Entity>>,
  ActionDto extends DtoActionConfig = InferDto<Entity>['actions'],
  OrmRepository extends BaseOrmRepository<
    Entity,
    ActionDto
  > = BaseOrmRepository<Entity, ActionDto>,
> {
  protected constructor(protected readonly repository: OrmRepository) {}

  get eventEmitter() {
    return this.repository.getEventEmitter();
  }

  @Inject(LoggerService)
  readonly logger: LoggerService;

  getRepository(): OrmRepository {
    return this.repository;
  }

  canPopulate(populate: string[]): boolean {
    return this.repository.canPopulate(populate);
  }

  async find(
    options?: FindManyOptions<Entity>,
  ): Promise<InferTransformDto<Entity['plainCls']>[]> {
    return await this.repository.find(options);
  }

  async findAndPopulate(
    options?: FindManyOptions<Entity>,
  ): Promise<InferTransformDto<Entity['fullCls']>[]> {
    return await this.repository.findAndPopulate(options);
  }

  async findAll(
    options?: FindAllOptions<Entity>,
  ): Promise<InferTransformDto<Entity['plainCls']>[]> {
    return await this.repository.findAll(options);
  }

  async findAllAndPopulate(
    options?: FindAllOptions<Entity>,
  ): Promise<InferTransformDto<Entity['fullCls']>[]> {
    return await this.repository.findAllAndPopulate(options);
  }

  async count(options?: FindManyOptions<Entity>): Promise<number> {
    return await this.repository.count(options);
  }

  async findOne(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferTransformDto<Entity['plainCls']> | null> {
    return await this.repository.findOne(idOrOptions);
  }

  async findOneAndPopulate(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferTransformDto<Entity['fullCls']> | null> {
    return await this.repository.findOneAndPopulate(idOrOptions);
  }

  async create(
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<Entity['plainCls']>> {
    return await this.repository.create(payload);
  }

  async createMany(
    payloads: InferActionDto<DtoAction.Create, ActionDto>[],
  ): Promise<InferTransformDto<Entity['plainCls']>[]> {
    return await this.repository.createMany(payloads);
  }

  async updateOne(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    options?: UpdateOneOptions,
  ): Promise<InferTransformDto<Entity['plainCls']>> {
    return await this.repository.updateOne(idOrOptions, payload, options);
  }

  async updateMany(
    options: FindManyOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
  ): Promise<InferTransformDto<Entity['plainCls']>[]> {
    return await this.repository.updateMany(options, payload);
  }

  async findOneOrCreate(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<Entity['plainCls']>> {
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
