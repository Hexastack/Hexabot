/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import get from 'lodash/get';
import { DeepPartial, FindOptionsOrder, Repository } from 'typeorm';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';
import { TFilterQuery } from '../types/filter.types';

import { DeleteResult } from './base-repository';

type SortTuple<T> = QuerySortDto<T>;

export abstract class BaseOrmRepository<T extends { id: string }> {
  protected constructor(protected readonly repository: Repository<T>) {}

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
    return await this.repository.save(entity);
  }

  async createMany(payloads: DeepPartial<T>[]): Promise<T[]> {
    const entities = this.repository.create(payloads);
    return await this.repository.save(entities);
  }

  async update(id: string, payload: DeepPartial<T>): Promise<T | null> {
    const entity = await this.repository.findOne({
      where: { id } as any,
    });
    if (!entity) {
      return null;
    }

    Object.assign(entity, payload);
    return await this.repository.save(entity);
  }

  async deleteMany(filter: TFilterQuery<T>): Promise<DeleteResult> {
    const matches = this.applyFilter(await this.repository.find(), filter);
    if (matches.length === 0) {
      return { acknowledged: true, deletedCount: 0 };
    }

    await this.repository.delete(matches.map((entity) => entity.id));
    return { acknowledged: true, deletedCount: matches.length };
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
}
