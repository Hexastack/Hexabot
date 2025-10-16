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
import camelCase from 'lodash/camelCase';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

import { LoggerService } from '@/logger/logger.service';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';
import { TFilterQuery } from '../types/filter.types';

import { DeleteResult, EHook } from './base-repository';
import { LegacyQueryConverter } from './legacy-query.converter';

export type UpdateOneOptions = {
  upsert?: boolean;
};

type SortTuple<T> = QuerySortDto<T>;

type FindAllOptions<T> = Omit<FindManyOptions<T>, 'where'> & { where?: never };

export abstract class BaseOrmRepository<T extends { id: string }> {
  protected constructor(protected readonly repository: Repository<T>) {
    this.legacyQueryConverter = new LegacyQueryConverter<T>((sort) =>
      this.normalizeSort(sort),
    );
  }

  @Inject(EventEmitter2)
  protected readonly eventEmitter: EventEmitter2;

  @Inject(LoggerService)
  protected readonly logger: LoggerService;

  private readonly legacyQueryConverter: LegacyQueryConverter<T>;

  /**
   * @deprecated Use findAll(options) with TypeORM FindManyOptions (without `where`) instead.
   */
  async findAll(sort?: SortTuple<T>): Promise<T[]>;

  async findAll(options?: FindAllOptions<T>): Promise<T[]>;

  async findAll(
    sortOrOptions?: SortTuple<T> | FindAllOptions<T>,
  ): Promise<T[]> {
    if (this.isFindManyOptions(sortOrOptions as any)) {
      const { where: _ignored, ...options } = (sortOrOptions ??
        {}) as FindManyOptions<T>;
      return await this.repository.find(options);
    }

    const sort = Array.isArray(sortOrOptions)
      ? (sortOrOptions as SortTuple<T>)
      : undefined;
    const order = this.normalizeSort(sort);

    return await this.repository.find(order ? { order } : undefined);
  }

  /**
   * @deprecated Use find(options) with TypeORM FindManyOptions instead.
   */
  async find(
    filter: TFilterQuery<T>,
    pageQuery?: PageQueryDto<T>,
  ): Promise<T[]>;

  async find(options?: FindManyOptions<T>): Promise<T[]>;

  async find(
    filterOrOptions: TFilterQuery<T> | FindManyOptions<T> = {},
    pageQuery?: PageQueryDto<T>,
  ): Promise<T[]> {
    const hasPageQuery = typeof pageQuery !== 'undefined';
    const isFindOptions = this.isFindManyOptions(filterOrOptions);

    if (isFindOptions && !hasPageQuery) {
      return await this.repository.find(filterOrOptions);
    }

    const baseOptions: FindManyOptions<T> = isFindOptions
      ? { ...filterOrOptions }
      : {};
    const legacyFilter = isFindOptions
      ? ((filterOrOptions.where ?? {}) as TFilterQuery<T>)
      : (filterOrOptions as TFilterQuery<T>);

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

    return await this.repository.find(options);
  }

  /**
   * @deprecated Use count(options) with TypeORM FindManyOptions instead.
   */
  async count(filter: TFilterQuery<T>): Promise<number>;

  async count(options?: FindManyOptions<T>): Promise<number>;

  async count(
    filterOrOptions: TFilterQuery<T> | FindManyOptions<T> = {},
  ): Promise<number> {
    if (this.isFindManyOptions(filterOrOptions)) {
      return await this.repository.count(filterOrOptions);
    }

    const filter = filterOrOptions as TFilterQuery<T>;
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
  async findOne(criteria: string | TFilterQuery<T>): Promise<T | null>;

  async findOne(options: FindOneOptions<T>): Promise<T | null>;

  async findOne(
    criteriaOrOptions: string | TFilterQuery<T> | FindOneOptions<T>,
  ): Promise<T | null> {
    if (typeof criteriaOrOptions === 'string') {
      return (
        (await this.repository.findOne({
          where: { id: criteriaOrOptions } as any,
        })) ?? null
      );
    }

    if (this.isFindManyOptions(criteriaOrOptions)) {
      const options = criteriaOrOptions as FindOneOptions<T>;
      return (await this.repository.findOne(options)) ?? null;
    }

    const filter = criteriaOrOptions as TFilterQuery<T>;
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

  async create(payload: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(payload);
    await this.preCreate(entity);
    await this.emitHook(EHook.preCreate, entity);
    const created = await this.repository.save(entity);
    await this.postCreate(created);
    await this.emitHook(EHook.postCreate, created);
    return created;
  }

  async createMany(payloads: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repository.create(payloads);
    for (const entity of entities) {
      await this.preCreate(entity);
      await this.emitHook(EHook.preCreate, entity);
    }
    const created = await this.repository.save(entities);
    for (const entity of created) {
      await this.postCreate(entity);
      await this.emitHook(EHook.postCreate, entity);
    }
    return created;
  }

  async update(id: string, payload: DeepPartial<T>): Promise<T | null> {
    const entity = await this.repository.findOne({
      where: { id } as FindOptionsWhere<T>,
    });
    if (!entity) {
      return null;
    }

    const snapshot = { ...(entity as object) } as T;
    await this.preUpdate(snapshot, payload);
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
    return updated;
  }

  async updateOne(
    criteria: string | TFilterQuery<T>,
    payload: DeepPartial<T>,
    options?: UpdateOneOptions,
  ): Promise<T> {
    const existing = await this.findOne(criteria);
    if (existing) {
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
      const basePayload =
        typeof criteria === 'string'
          ? ({ id: criteria } as DeepPartial<T>)
          : this.extractCreationPayload(criteria);
      return await this.create({
        ...basePayload,
        ...payload,
      });
    } else {
      throw new NotFoundException('Unable to execute updateOne() - No updates');
    }
  }

  /**
   * @deprecated Use findOneOrCreate(options, payload) with TypeORM FindOneOptions instead.
   */
  async findOneOrCreate(
    criteria: string | TFilterQuery<T>,
    payload: DeepPartial<T>,
  ): Promise<T>;

  async findOneOrCreate(
    options: FindOneOptions<T>,
    payload: DeepPartial<T>,
  ): Promise<T>;

  async findOneOrCreate(
    criteriaOrOptions: string | TFilterQuery<T> | FindOneOptions<T>,
    payload: DeepPartial<T>,
  ): Promise<T> {
    if (typeof criteriaOrOptions === 'string') {
      const existing = await this.findOne(criteriaOrOptions);
      if (existing) {
        return existing;
      }

      return await this.create({
        id: criteriaOrOptions,
        ...payload,
      } as DeepPartial<T>);
    }

    if (this.isFindManyOptions(criteriaOrOptions)) {
      const options = criteriaOrOptions as FindOneOptions<T>;
      const existing = await this.repository.findOne(options);
      if (existing) {
        return existing;
      }

      const basePayload = this.extractCreationPayload(
        (options.where ?? {}) as TFilterQuery<T>,
      );
      return await this.create({
        ...basePayload,
        ...payload,
      });
    }

    const criteria = criteriaOrOptions as TFilterQuery<T>;
    const existing = await this.findOne(criteria);
    if (existing) {
      return existing;
    }

    const basePayload = this.extractCreationPayload(criteria);

    return await this.create({
      ...basePayload,
      ...payload,
    });
  }

  /**
   * @deprecated Use deleteMany(options) with TypeORM FindManyOptions instead.
   */
  async deleteMany(filter: TFilterQuery<T>): Promise<DeleteResult>;

  async deleteMany(options?: FindManyOptions<T>): Promise<DeleteResult>;

  async deleteMany(
    filterOrOptions: TFilterQuery<T> | FindManyOptions<T> = {},
  ): Promise<DeleteResult> {
    if (this.isFindManyOptions(filterOrOptions)) {
      const options = filterOrOptions as FindManyOptions<T>;
      const matches = await this.repository.find(options);
      if (matches.length === 0) {
        return { acknowledged: true, deletedCount: 0 };
      }

      const filter = (options.where ?? {}) as TFilterQuery<T>;
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

    const filter = filterOrOptions as TFilterQuery<T>;
    const { where, fullyHandled } =
      this.legacyQueryConverter.convertFilter(filter);

    if (!fullyHandled) {
      throw new Error(
        'Unsupported legacy filter. Please use TypeORM FindManyOptions instead.',
      );
    }

    const matches = await this.repository.find(
      where ? ({ where } as FindManyOptions<T>) : undefined,
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
  async deleteOne(criteria: string | TFilterQuery<T>): Promise<DeleteResult>;

  async deleteOne(options: FindOneOptions<T>): Promise<DeleteResult>;

  async deleteOne(
    criteriaOrOptions: string | TFilterQuery<T> | FindOneOptions<T>,
  ): Promise<DeleteResult> {
    if (typeof criteriaOrOptions === 'string') {
      const filter = { id: criteriaOrOptions } as TFilterQuery<T>;
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

    if (this.isFindManyOptions(criteriaOrOptions)) {
      const options = criteriaOrOptions as FindOneOptions<T>;
      const entity = (await this.repository.findOne(options)) ?? null;
      if (!entity) {
        return { acknowledged: true, deletedCount: 0 };
      }

      const filter = (options.where ?? {}) as TFilterQuery<T>;
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

    const filter = criteriaOrOptions as TFilterQuery<T>;
    const { where, fullyHandled } =
      this.legacyQueryConverter.convertFilter(filter);

    if (!fullyHandled) {
      throw new Error(
        'Unsupported legacy filter. Please use TypeORM FindOneOptions instead.',
      );
    }

    let entity: T | null = null;

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
    sort?: SortTuple<T>,
  ): FindOptionsOrder<T> | undefined {
    if (!sort) return undefined;
    const [property, order] = sort;
    const direction =
      order === 'asc' || order === 'ascending' || order === 1 ? 'ASC' : 'DESC';
    return { [property as keyof T]: direction } as FindOptionsOrder<T>;
  }

  protected isFindManyOptions(
    input: TFilterQuery<T> | FindManyOptions<T> | FindOneOptions<T>,
  ): input is FindManyOptions<T> | FindOneOptions<T> {
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

  protected async preCreate(_entity: DeepPartial<T> | T): Promise<void> {}

  protected async postCreate(_entity: T): Promise<void> {}

  protected async preUpdate(
    _current: T,
    _changes: DeepPartial<T>,
  ): Promise<void> {}

  protected async postUpdate(_updated: T): Promise<void> {}

  protected async preDelete(
    _entities: T[],
    _filter: TFilterQuery<T>,
  ): Promise<void> {}

  protected async postDelete(
    _entities: T[],
    _result: DeleteResult,
  ): Promise<void> {}

  protected extractCreationPayload(criteria: TFilterQuery<T>): DeepPartial<T> {
    if (!criteria || typeof criteria !== 'object' || Array.isArray(criteria)) {
      return {} as DeepPartial<T>;
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

    return payload as DeepPartial<T>;
  }
}
