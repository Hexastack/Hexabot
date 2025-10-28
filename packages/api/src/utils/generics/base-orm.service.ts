/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { FindManyOptions, FindOneOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import {
  DtoAction,
  DtoActionConfig,
  DtoTransformer,
  DtoTransformerConfig,
  InferActionDto,
  InferTransformDto,
} from '../types/dto.types';

import {
  BaseOrmRepository,
  DeleteResult,
  FindAllOptions,
  UpdateOneOptions,
} from './base-orm.repository';

export abstract class BaseOrmService<
  Entity extends BaseOrmEntity,
  TransformerDto extends DtoTransformerConfig,
  ActionDto extends DtoActionConfig,
  OrmRepository extends BaseOrmRepository<
    Entity,
    TransformerDto,
    ActionDto
  > = BaseOrmRepository<Entity, TransformerDto, ActionDto>,
> {
  readonly eventEmitter: EventEmitter2;

  protected constructor(protected readonly repository: OrmRepository) {
    this.eventEmitter = repository.getEventEmitter();
  }

  getRepository(): OrmRepository {
    return this.repository;
  }

  canPopulate(populate: string[]): boolean {
    return this.repository.canPopulate(populate);
  }

  async find(
    options?: FindManyOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    return await this.repository.find(options);
  }

  async findAndPopulate(
    options?: FindManyOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]> {
    return await this.repository.findAndPopulate(options);
  }

  async findAll(
    options?: FindAllOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    return await this.repository.findAll(options);
  }

  async findAllAndPopulate(
    options?: FindAllOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]> {
    return await this.repository.findAllAndPopulate(options);
  }

  async count(options?: FindManyOptions<Entity>): Promise<number> {
    return await this.repository.count(options);
  }

  async findOne(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferTransformDto<
    DtoTransformer.PlainCls,
    TransformerDto
  > | null> {
    return await this.repository.findOne(idOrOptions);
  }

  async findOneAndPopulate(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto> | null> {
    return await this.repository.findOneAndPopulate(idOrOptions);
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

  async updateOne(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    options?: UpdateOneOptions,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    return await this.repository.updateOne(idOrOptions, payload, options);
  }

  async updateMany(
    options: FindManyOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    return await this.repository.updateMany(options, payload);
  }

  async findOneOrCreate(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
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
