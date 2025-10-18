/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject, NotFoundException } from '@nestjs/common';
import {
  EventEmitter2,
  IHookEntities,
  TNormalizedEvents,
} from '@nestjs/event-emitter';
import { plainToInstance } from 'class-transformer';
import camelCase from 'lodash/camelCase';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  Repository,
} from 'typeorm';

import { LoggerService } from '@/logger/logger.service';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';
import {
  DtoAction,
  DtoActionConfig,
  DtoTransformer,
  DtoTransformerConfig,
  InferActionDto,
  InferTransformDto,
} from '../types/dto.types';
import { TFilterQuery } from '../types/filter.types';

import { DeleteResult, EHook } from './base-repository';
import { LegacyQueryConverter } from './legacy-query.converter';

export type UpdateOneOptions = {
  upsert?: boolean;
};

export type SortTuple<EntityType> = QuerySortDto<EntityType>;

export type FindAllOptions<EntityType> = Omit<
  FindManyOptions<EntityType>,
  'where'
> & {
  where?: never;
};

export abstract class BaseOrmRepository<
  Entity extends { id: string },
  TransformerDto extends DtoTransformerConfig,
  ActionDto extends DtoActionConfig,
> {
  protected constructor(
    protected readonly repository: Repository<Entity>,
    protected readonly populateRelations: string[] = [],
    protected readonly transformers: TransformerDto,
  ) {
    this.legacyQueryConverter = new LegacyQueryConverter<Entity>((sort) =>
      this.normalizeSort(sort),
    );
  }

  getPopulateRelations(): readonly string[] {
    return this.populateRelations;
  }

  canPopulate(populate: string[]): boolean {
    if (!Array.isArray(populate) || populate.length === 0) {
      return false;
    }

    return populate.every((relation) =>
      this.populateRelations.includes(relation),
    );
  }

  getEventEmitter(): EventEmitter2 | undefined {
    return this.eventEmitter;
  }

  @Inject(EventEmitter2)
  protected readonly eventEmitter: EventEmitter2;

  @Inject(LoggerService)
  protected readonly logger: LoggerService;

  private readonly legacyQueryConverter: LegacyQueryConverter<Entity>;

  private getTransformer<D extends DtoTransformer>(t: D) {
    return (entity: Entity): InferTransformDto<D, TransformerDto> => {
      return plainToInstance(this.transformers[t] as any, entity);
    };
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
    const entities = await this.findAllEntities(sortOrOptions);
    return entities.map(this.getTransformer(DtoTransformer.PlainCls));
  }

  private async findAllEntities(
    sortOrOptions?: SortTuple<Entity> | FindAllOptions<Entity>,
  ): Promise<Entity[]> {
    if (this.isFindOptions(sortOrOptions as any)) {
      const { where: _ignored, ...options } = (sortOrOptions ??
        {}) as FindManyOptions<Entity>;
      return await this.repository.find(options);
    }

    const sort = Array.isArray(sortOrOptions)
      ? (sortOrOptions as SortTuple<Entity>)
      : undefined;
    const order = this.normalizeSort(sort);

    return await this.repository.find(order ? { order } : undefined);
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
    const entities = await this.findAllEntities(sortOrOptions);
    const populated = await this.populateCollection(entities);
    return populated.map(this.getTransformer(DtoTransformer.FullCls));
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
    const entities = await this.findEntities(filterOrOptions, pageQuery);
    return entities.map(this.getTransformer(DtoTransformer.PlainCls));
  }

  private async findEntities(
    filterOrOptions: TFilterQuery<Entity> | FindManyOptions<Entity> = {},
    pageQuery?: PageQueryDto<Entity>,
    populate = false,
  ): Promise<Entity[]> {
    const hasPageQuery = typeof pageQuery !== 'undefined';
    const isFindOptions = this.isFindOptions(filterOrOptions);

    if (isFindOptions && !hasPageQuery) {
      return await this.repository.find(
        populate
          ? { ...filterOrOptions, relations: this.populateRelations }
          : filterOrOptions,
      );
    }

    const baseOptions: FindManyOptions<Entity> = isFindOptions
      ? { ...filterOrOptions }
      : {};
    const legacyFilter = isFindOptions
      ? ((filterOrOptions.where ?? {}) as TFilterQuery<Entity>)
      : (filterOrOptions as TFilterQuery<Entity>);

    const { options, fullyHandled } =
      this.legacyQueryConverter.buildFindOptionsFromLegacyArgs(
        legacyFilter,
        pageQuery,
        baseOptions,
      );

    if (!fullyHandled) {
      throw new Error(
        'Unsupported legacy filter. Please use TypeORM FindManyOptions instead.',
      );
    }

    return await this.repository.find(
      populate ? { ...options, relations: this.populateRelations } : options,
    );
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
    const entities = await this.findEntities(filterOrOptions, pageQuery, true);
    return entities.map(this.getTransformer(DtoTransformer.FullCls));
  }

  /**
   * @deprecated Use count(options) with TypeORM FindManyOptions instead.
   */
  async count(filter: TFilterQuery<Entity>): Promise<number>;

  async count(options?: FindManyOptions<Entity>): Promise<number>;

  async count(
    filterOrOptions: TFilterQuery<Entity> | FindManyOptions<Entity> = {},
  ): Promise<number> {
    if (this.isFindOptions(filterOrOptions)) {
      return await this.repository.count(filterOrOptions);
    }

    const filter = filterOrOptions as TFilterQuery<Entity>;
    const { where, fullyHandled } =
      this.legacyQueryConverter.convertFilter(filter);

    if (fullyHandled && where) {
      return await this.repository.count({ where });
    }

    if (fullyHandled) {
      return await this.repository.count();
    }

    throw new Error(
      'Unsupported legacy filter. Please use TypeORM FindManyOptions instead.',
    );
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
    const entity = await this.findOneEntity(criteriaOrOptions);
    return entity ? this.getTransformer(DtoTransformer.PlainCls)(entity) : null;
  }

  private async findOneEntity(
    criteriaOrOptions: string | TFilterQuery<Entity> | FindOneOptions<Entity>,
    populate = false,
  ): Promise<Entity | null> {
    if (typeof criteriaOrOptions === 'string') {
      return (
        (await this.repository.findOne({
          where: { id: criteriaOrOptions } as FindOptionsWhere<Entity>,
          ...(populate ? { relations: this.populateRelations } : {}),
        })) ?? null
      );
    }

    if (this.isFindOptions(criteriaOrOptions)) {
      const options = criteriaOrOptions as FindOneOptions<Entity>;
      return (
        (await this.repository.findOne(
          populate
            ? { ...options, relations: this.populateRelations }
            : options,
        )) ?? null
      );
    }

    const filter = criteriaOrOptions as TFilterQuery<Entity>;
    const { where, fullyHandled } =
      this.legacyQueryConverter.convertFilter(filter);

    if (!fullyHandled) {
      throw new Error(
        'Unsupported legacy filter. Please use TypeORM FindOneOptions instead.',
      );
    }

    if (where) {
      return (await this.repository.findOne({ where })) ?? null;
    }

    const [first] = await this.repository.find({ take: 1 });
    return first ?? null;
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
    const entity = await this.findOneEntity(criteria as any, true);
    return entity ? this.getTransformer(DtoTransformer.FullCls)(entity) : null;
  }

  async create(
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    const entity = this.repository.create(payload as DeepPartial<Entity>);
    await this.preCreate(entity);
    await this.emitHook(EHook.preCreate, entity);
    const created = await this.repository.save(entity);
    await this.postCreate(created);
    await this.emitHook(EHook.postCreate, created);
    return this.getTransformer(DtoTransformer.PlainCls)(created);
  }

  async createMany(
    payloads: InferActionDto<DtoAction.Create, ActionDto>[],
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    const entities = this.repository.create(payloads as DeepPartial<Entity>[]);
    for (const entity of entities) {
      await this.preCreate(entity);
      await this.emitHook(EHook.preCreate, entity);
    }
    const created = await this.repository.save(entities);
    for (const entity of created) {
      await this.postCreate(entity);
      await this.emitHook(EHook.postCreate, entity);
    }
    return created.map(this.getTransformer(DtoTransformer.PlainCls));
  }

  async update(
    id: string,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
  ): Promise<InferTransformDto<
    DtoTransformer.PlainCls,
    TransformerDto
  > | null> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<Entity>,
    });

    if (!entity) {
      return null;
    }

    const snapshot = { ...entity };
    await this.preUpdate(snapshot, payload as DeepPartial<Entity>);
    await this.emitHook(EHook.preUpdate, {
      entity: snapshot,
      changes: payload,
    });
    Object.assign(entity, payload);
    const updated = await this.repository.save(entity);
    await this.postUpdate(updated);
    await this.emitHook(EHook.postUpdate, {
      entity: updated,
      previous: snapshot,
    });
    return this.getTransformer(DtoTransformer.PlainCls)(updated);
  }

  /**
   * @deprecated Use updateOne(options, payload) with TypeORM FindOneOptions instead.
   */
  async updateOne(
    criteria: string | TFilterQuery<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    options?: UpdateOneOptions,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>>;

  async updateOne(
    options: FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    opts?: UpdateOneOptions,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>>;

  async updateOne(
    criteriaOrOptions: string | TFilterQuery<Entity> | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    options?: UpdateOneOptions,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    const existing = await this.findOne(
      criteriaOrOptions as FindOneOptions<Entity>,
    );
    if (existing) {
      // @ts-expect-error todo
      const result = await this.update(existing.id, payload);
      if (result) {
        return result;
      } else {
        throw new NotFoundException(
          'Unable to execute updateOne() - No updates',
        );
      }
    }

    if (options?.upsert) {
      return await this.create(
        payload as unknown as InferActionDto<DtoAction.Create, ActionDto>,
      );
    } else {
      throw new NotFoundException('Unable to execute updateOne() - No updates');
    }
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
    if (typeof criteriaOrOptions === 'string') {
      const existing = await this.findOne(criteriaOrOptions);
      if (existing) {
        return existing;
      }

      return await this.create(payload);
    }

    if (this.isFindOptions(criteriaOrOptions)) {
      const options = criteriaOrOptions as FindOneOptions<Entity>;
      const existing = await this.repository.findOne(options);
      if (existing) {
        return this.getTransformer(DtoTransformer.PlainCls)(existing);
      }

      return await this.create(payload);
    }

    const criteria = criteriaOrOptions as TFilterQuery<Entity>;
    const existing = await this.findOne(criteria);
    if (existing) {
      return existing;
    }

    return await this.create(payload);
  }

  /**
   * @deprecated Use deleteMany(options) with TypeORM FindManyOptions instead.
   */
  async deleteMany(filter: TFilterQuery<Entity>): Promise<DeleteResult>;

  async deleteMany(options?: FindManyOptions<Entity>): Promise<DeleteResult>;

  async deleteMany(
    filterOrOptions: TFilterQuery<Entity> | FindManyOptions<Entity> = {},
  ): Promise<DeleteResult> {
    if (this.isFindOptions(filterOrOptions)) {
      const options = filterOrOptions as FindManyOptions<Entity>;
      const matches = await this.repository.find(options);
      if (matches.length === 0) {
        return { acknowledged: true, deletedCount: 0 };
      }

      const filter = (options.where ?? {}) as TFilterQuery<Entity>;
      await this.preDelete(matches, filter);
      await this.emitHook(EHook.preDelete, { entities: matches, filter });
      await this.repository.delete(matches.map((entity) => entity.id));
      const result: DeleteResult = {
        acknowledged: true,
        deletedCount: matches.length,
      };
      await this.postDelete(matches, result);
      await this.emitHook(EHook.postDelete, { entities: matches, result });
      return result;
    }

    const filter = filterOrOptions as TFilterQuery<Entity>;
    const { where, fullyHandled } =
      this.legacyQueryConverter.convertFilter(filter);

    if (!fullyHandled) {
      throw new Error(
        'Unsupported legacy filter. Please use TypeORM FindManyOptions instead.',
      );
    }

    const matches = await this.repository.find(
      where ? ({ where } as FindManyOptions<Entity>) : undefined,
    );

    if (matches.length === 0) {
      return { acknowledged: true, deletedCount: 0 };
    }

    await this.preDelete(matches, filter);
    await this.emitHook(EHook.preDelete, { entities: matches, filter });
    await this.repository.delete(matches.map((entity) => entity.id));
    const result: DeleteResult = {
      acknowledged: true,
      deletedCount: matches.length,
    };
    await this.postDelete(matches, result);
    await this.emitHook(EHook.postDelete, { entities: matches, result });
    return result;
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
    if (typeof criteriaOrOptions === 'string') {
      const filter = { id: criteriaOrOptions } as TFilterQuery<Entity>;
      const entity =
        (await this.repository.findOne({
          where: { id: criteriaOrOptions } as any,
        })) ?? null;

      if (!entity) {
        return { acknowledged: true, deletedCount: 0 };
      }

      await this.preDelete([entity], filter);
      await this.emitHook(EHook.preDelete, { entities: [entity], filter });
      await this.repository.delete(entity.id);
      const result: DeleteResult = {
        acknowledged: true,
        deletedCount: 1,
      };
      await this.postDelete([entity], result);
      await this.emitHook(EHook.postDelete, { entities: [entity], result });
      return result;
    }

    if (this.isFindOptions(criteriaOrOptions)) {
      const options = criteriaOrOptions as FindOneOptions<Entity>;
      const entity = (await this.repository.findOne(options)) ?? null;
      if (!entity) {
        return { acknowledged: true, deletedCount: 0 };
      }

      const filter = (options.where ?? {}) as TFilterQuery<Entity>;
      await this.preDelete([entity], filter);
      await this.emitHook(EHook.preDelete, { entities: [entity], filter });
      await this.repository.delete(entity.id);
      const result: DeleteResult = {
        acknowledged: true,
        deletedCount: 1,
      };
      await this.postDelete([entity], result);
      await this.emitHook(EHook.postDelete, { entities: [entity], result });
      return result;
    }

    const filter = criteriaOrOptions as TFilterQuery<Entity>;
    const { where, fullyHandled } =
      this.legacyQueryConverter.convertFilter(filter);

    if (!fullyHandled) {
      throw new Error(
        'Unsupported legacy filter. Please use TypeORM FindOneOptions instead.',
      );
    }

    let entity: Entity | null = null;

    if (where) {
      entity = (await this.repository.findOne({ where })) ?? null;
    } else {
      const [first] = await this.repository.find({ take: 1 });
      entity = first ?? null;
    }

    if (!entity) {
      return { acknowledged: true, deletedCount: 0 };
    }

    await this.preDelete([entity], filter);
    await this.emitHook(EHook.preDelete, { entities: [entity], filter });
    await this.repository.delete(entity.id);
    const result: DeleteResult = {
      acknowledged: true,
      deletedCount: 1,
    };
    await this.postDelete([entity], result);
    await this.emitHook(EHook.postDelete, { entities: [entity], result });
    return result;
  }

  protected normalizeSort(
    sort?: SortTuple<Entity>,
  ): FindOptionsOrder<Entity> | undefined {
    if (!sort) return undefined;
    const [property, order] = sort;
    const direction =
      order === 'asc' || order === 'ascending' || order === 1 ? 'ASC' : 'DESC';
    return {
      [property as keyof Entity]: direction,
    } as FindOptionsOrder<Entity>;
  }

  public isFindOptions(
    input:
      | TFilterQuery<Entity>
      | FindManyOptions<Entity>
      | FindOneOptions<Entity>,
  ): input is FindManyOptions<Entity> | FindOneOptions<Entity> {
    if (!input || typeof input !== 'object') {
      return false;
    }

    const optionKeys = [
      'where',
      'relations',
      'select',
      'order',
      'withDeleted',
      'loadEagerRelations',
      'loadRelationIds',
      'take',
      'skip',
      'lock',
      'cache',
    ];

    return optionKeys.some((key) =>
      Object.prototype.hasOwnProperty.call(input, key),
    );
  }

  protected getEventName(
    suffix: EHook,
  ): `hook:${IHookEntities}:${TNormalizedEvents}` {
    const entityName =
      camelCase(this.repository.metadata.name ?? 'entity') || 'entity';
    return `hook:${entityName}:${suffix}` as `hook:${IHookEntities}:${TNormalizedEvents}`;
  }

  protected async emitHook(suffix: EHook, ...args: any[]): Promise<void> {
    if (!this.eventEmitter) return;
    const eventName = this.getEventName(suffix);
    const emitAsync = this.eventEmitter.emitAsync.bind(this.eventEmitter) as (
      event: string,
      ...emitArgs: any[]
    ) => Promise<unknown>;
    await emitAsync(eventName, ...args);
  }

  // Hooks available for child repositories

  protected async preCreate(
    _entity: DeepPartial<Entity> | Entity,
  ): Promise<void> {}

  protected async postCreate(_entity: Entity): Promise<void> {}

  protected async preUpdate(
    _current: Entity,
    _changes: DeepPartial<Entity>,
  ): Promise<void> {}

  protected async postUpdate(_updated: Entity): Promise<void> {}

  protected async preDelete(
    _entities: Entity[],
    _filter: TFilterQuery<Entity>,
  ): Promise<void> {}

  protected async postDelete(
    _entities: Entity[],
    _result: DeleteResult,
  ): Promise<void> {}

  protected async populateCollection(entities: Entity[]): Promise<Entity[]> {
    if (!this.populateRelations.length || entities.length === 0) {
      return entities;
    }

    const ids = entities.map((entity) => entity.id);
    const populated = await this.repository.find({
      where: { id: In(ids) } as FindOptionsWhere<Entity>,
      relations: this.populateRelations,
    });

    const map = new Map(populated.map((entity) => [entity.id, entity]));
    return entities.map((entity) => map.get(entity.id) ?? entity);
  }

  protected extractCreationPayload(
    criteria: TFilterQuery<Entity>,
  ): DeepPartial<Entity> {
    if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) {
      return {} as DeepPartial<Entity>;
    }

    const payload: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(
      criteria as Record<string, unknown>,
    )) {
      if (key.startsWith('$')) {
        continue;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const objectValue = value as Record<string, unknown>;

        if ('$eq' in objectValue) {
          payload[key] = objectValue.$eq;
        } else {
          payload[key] = value;
        }
      } else {
        payload[key] = value;
      }
    }

    return payload as DeepPartial<Entity>;
  }
}
