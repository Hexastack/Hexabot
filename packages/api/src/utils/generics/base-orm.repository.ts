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
import get from 'lodash/get';
import { DeepPartial, FindOptionsOrder, Repository } from 'typeorm';

import { LoggerService } from '@/logger/logger.service';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';
import { TFilterQuery } from '../types/filter.types';

import { DeleteResult, EHook } from './base-repository';

export type UpdateOneOptions = {
  upsert?: boolean;
};

type SortTuple<T> = QuerySortDto<T>;

export abstract class BaseOrmRepository<T extends { id: string }> {
  protected constructor(protected readonly repository: Repository<T>) {}

  @Inject(EventEmitter2)
  protected readonly eventEmitter: EventEmitter2;

  @Inject(LoggerService)
  protected readonly logger: LoggerService;

  async findAll(sort?: SortTuple<T>): Promise<T[]> {
    return await this.repository.find({
      order: this.normalizeSort(sort),
    });
  }

  async find(
    filter: TFilterQuery<T> = {},
    pageQuery?: PageQueryDto<T>,
  ): Promise<T[]> {
    const all = await this.repository.find();
    const filtered = this.applyFilter(all, filter);
    return this.applyPagination(filtered, pageQuery);
  }

  async count(filter: TFilterQuery<T> = {}): Promise<number> {
    const all = await this.repository.find();
    return this.applyFilter(all, filter).length;
  }

  async findOne(criteria: string | TFilterQuery<T>): Promise<T | null> {
    if (typeof criteria === 'string') {
      return (
        (await this.repository.findOne({
          where: { id: criteria } as any,
        })) ?? null
      );
    }

    const filtered = this.applyFilter(await this.repository.find(), criteria);
    return filtered[0] ?? null;
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
      where: { id } as any,
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

  async findOneOrCreate(
    criteria: string | TFilterQuery<T>,
    payload: DeepPartial<T>,
  ): Promise<T> {
    const existing = await this.findOne(criteria);
    if (existing) {
      return existing;
    }

    const basePayload =
      typeof criteria === 'string'
        ? ({ id: criteria } as DeepPartial<T>)
        : this.extractCreationPayload(criteria);

    return await this.create({
      ...basePayload,
      ...payload,
    });
  }

  async deleteMany(filter: TFilterQuery<T>): Promise<DeleteResult> {
    const matches = this.applyFilter(await this.repository.find(), filter);
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

  async deleteOne(criteria: string | TFilterQuery<T>): Promise<DeleteResult> {
    const filter =
      typeof criteria === 'string'
        ? ({ id: criteria } as TFilterQuery<T>)
        : criteria;

    const matches = this.applyFilter(await this.repository.find(), filter);
    if (matches.length === 0) {
      return { acknowledged: true, deletedCount: 0 };
    }

    const [entity] = matches;
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

  protected applyPagination(entities: T[], pageQuery?: PageQueryDto<T>): T[] {
    if (!pageQuery) return entities;
    const { skip, limit, sort } = pageQuery;
    const ordered = sort
      ? [...entities].sort((a, b) => this.sortComparator(a, b, sort))
      : entities;
    const start = skip ?? 0;
    const end = limit ? start + limit : undefined;
    return ordered.slice(start, end);
  }

  protected sortComparator(entityA: T, entityB: T, sort: SortTuple<T>) {
    const [property, order] = sort;
    const direction =
      order === 'asc' || order === 'ascending' || order === 1 ? 1 : -1;
    const aValue = get(entityA, property as string);
    const bValue = get(entityB, property as string);

    if (aValue === bValue) return 0;
    return aValue > bValue ? direction : -direction;
  }

  protected applyFilter(entities: T[], filter: TFilterQuery<T> = {}): T[] {
    if (!filter || Object.keys(filter as object).length === 0) {
      return entities;
    }

    return entities.filter((entity) => this.matchesFilter(entity, filter));
  }

  protected matchesFilter(entity: T, filter: any): boolean {
    if (!filter) return true;

    if (Array.isArray(filter)) {
      return filter.every((partial) => this.matchesFilter(entity, partial));
    }

    if (filter.$and) {
      return filter.$and.every((rule: any) => this.matchesFilter(entity, rule));
    }

    if (filter.$or) {
      return filter.$or.some((rule: any) => this.matchesFilter(entity, rule));
    }

    if (filter.$nor) {
      return filter.$nor.every(
        (rule: any) => !this.matchesFilter(entity, rule),
      );
    }

    return Object.entries(filter).every(([key, value]) => {
      if (key.startsWith('$')) {
        return true;
      }

      const actualValue = get(entity, key);

      if (value instanceof RegExp) {
        return typeof actualValue === 'string'
          ? value.test(actualValue)
          : false;
      }

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        if ('$regex' in value) {
          const regex = value.$regex as RegExp;
          return typeof actualValue === 'string'
            ? regex.test(actualValue)
            : false;
        }

        if ('$in' in value) {
          const values = Array.isArray(value.$in) ? value.$in : [value.$in];
          return values.includes(actualValue);
        }

        if ('$nin' in value) {
          const values = Array.isArray(value.$nin) ? value.$nin : [value.$nin];
          return !values.includes(actualValue);
        }

        if ('$eq' in value) {
          return this.matchesFilter(entity, { [key]: value.$eq });
        }
      }

      if (Array.isArray(value)) {
        return Array.isArray(actualValue)
          ? value.every((v) => (actualValue as any[]).includes(v))
          : false;
      }

      return actualValue === value;
    });
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
