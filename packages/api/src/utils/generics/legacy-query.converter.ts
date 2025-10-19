/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  FindManyOptions,
  FindOperator,
  FindOptionsOrder,
  FindOptionsWhere,
  In,
  Not,
} from 'typeorm';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';
import { TFilterQuery } from '../types/filter.types';

type LegacyConversionTracker = { unsupported: boolean };
type SortNormalizer<T> = (
  sort?: QuerySortDto<T>,
) => FindOptionsOrder<T> | undefined;

export class LegacyQueryConverter<T> {
  constructor(private readonly sortNormalizer: SortNormalizer<T>) {}

  convertFilter(filter: TFilterQuery<T>): {
    where: FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined;
    fullyHandled: boolean;
  } {
    const hasFilter =
      !!filter &&
      typeof filter === 'object' &&
      Object.keys(filter as object).length > 0;

    if (!hasFilter) {
      return { where: undefined, fullyHandled: true };
    }

    const tracker: LegacyConversionTracker = { unsupported: false };
    const where = this.transformLegacyFilter(filter, tracker);
    const fullyHandled = !tracker.unsupported && !!where;

    return { where, fullyHandled };
  }

  buildFindOptionsFromLegacyArgs(
    filter: TFilterQuery<T>,
    pageQuery: PageQueryDto<T> | undefined,
    baseOptions: FindManyOptions<T>,
  ): { options: FindManyOptions<T>; fullyHandled: boolean } {
    let fullyHandled = true;
    const options: FindManyOptions<T> = { ...baseOptions };

    const filterConversion = this.convertFilter(filter);
    if (filterConversion.where) {
      options.where = filterConversion.where;
    }
    if (!filterConversion.fullyHandled) {
      fullyHandled = false;
    }

    if (pageQuery) {
      if (typeof pageQuery.skip === 'number') {
        options.skip = pageQuery.skip;
      }
      if (typeof pageQuery.limit === 'number') {
        options.take = pageQuery.limit;
      }
      const order = this.sortNormalizer(pageQuery.sort);
      if (order) {
        options.order = order;
      }
    }

    return { options, fullyHandled };
  }

  private transformLegacyFilter(
    filter: TFilterQuery<T>,
    tracker: LegacyConversionTracker,
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined {
    if (
      !filter ||
      typeof filter !== 'object' ||
      Object.keys(filter as object).length === 0
    ) {
      return undefined;
    }

    const clauses = this.transformLegacyFilterToArray(filter, tracker);
    if (clauses.length === 0) {
      return undefined;
    }
    if (clauses.length === 1) {
      return clauses[0];
    }
    return clauses;
  }

  private transformLegacyFilterToArray(
    filter: any,
    tracker: LegacyConversionTracker,
  ): FindOptionsWhere<T>[] {
    if (!filter) {
      return [];
    }

    if (Array.isArray(filter)) {
      return filter
        .map((item) => this.transformLegacyFilterToArray(item, tracker))
        .reduce(
          (acc, current) => this.combineWhereAnd(acc, current),
          [{} as FindOptionsWhere<T>],
        );
    }

    if (filter.$and) {
      const clauses = (filter.$and as any[]).map((clause) =>
        this.transformLegacyFilterToArray(clause, tracker),
      );
      return clauses.reduce(
        (acc, current) => this.combineWhereAnd(acc, current),
        [{} as FindOptionsWhere<T>],
      );
    }

    if (filter.$or) {
      return (filter.$or as any[]).flatMap((clause) =>
        this.transformLegacyFilterToArray(clause, tracker),
      );
    }

    if (filter.$nor) {
      tracker.unsupported = true;
      return [];
    }

    const clause = this.transformSimpleFilterObject(filter, tracker);
    return clause ? [clause] : [];
  }

  private combineWhereAnd(
    left: FindOptionsWhere<T>[],
    right: FindOptionsWhere<T>[],
  ): FindOptionsWhere<T>[] {
    const combinations: FindOptionsWhere<T>[] = [];
    for (const leftClause of left) {
      for (const rightClause of right) {
        combinations.push(this.mergeWhereObjects(leftClause, rightClause));
      }
    }
    return combinations;
  }

  private mergeWhereObjects(
    left: FindOptionsWhere<T>,
    right: FindOptionsWhere<T>,
  ): FindOptionsWhere<T> {
    const result: Record<string, any> = { ...left };
    for (const [key, value] of Object.entries(right)) {
      if (value === undefined) {
        continue;
      }
      const existing = result[key];
      if (this.isPlainObject(existing) && this.isPlainObject(value)) {
        result[key] = this.mergeWhereObjects(
          existing as FindOptionsWhere<T>,
          value as FindOptionsWhere<T>,
        );
      } else {
        result[key] = value;
      }
    }
    return result as FindOptionsWhere<T>;
  }

  private transformSimpleFilterObject(
    filter: Record<string, any>,
    tracker: LegacyConversionTracker,
  ): FindOptionsWhere<T> | undefined {
    const where: Record<string, any> = {};

    for (const [key, rawValue] of Object.entries(filter)) {
      if (key.startsWith('$')) {
        tracker.unsupported = true;
        continue;
      }

      const normalized = this.normalizeFilterValue(rawValue, tracker);
      if (normalized === undefined && rawValue !== undefined) {
        tracker.unsupported = true;
        continue;
      }

      this.assignNestedWhereValue(where, key, normalized);
    }

    return Object.keys(where).length === 0
      ? undefined
      : (where as FindOptionsWhere<T>);
  }

  private assignNestedWhereValue(
    target: Record<string, any>,
    path: string,
    value: unknown,
  ): void {
    if (value === undefined) return;
    const segments = path.split('.');
    let cursor = target;
    for (let index = 0; index < segments.length - 1; index++) {
      const segment = segments[index];
      if (!this.isPlainObject(cursor[segment])) {
        cursor[segment] = {};
      }
      cursor = cursor[segment] as Record<string, any>;
    }
    cursor[segments[segments.length - 1]] = value;
  }

  private normalizeFilterValue(
    value: unknown,
    tracker: LegacyConversionTracker,
  ): unknown {
    if (value instanceof FindOperator) {
      return value;
    }

    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value instanceof Date
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      return In(value);
    }

    if (value && typeof value === 'object') {
      if ('$in' in value) {
        const values = this.ensureArray((value as any).$in);
        return values ? In(values) : undefined;
      }

      if ('$nin' in value) {
        const values = this.ensureArray((value as any).$nin);
        return values ? Not(In(values)) : undefined;
      }

      if ('$eq' in value) {
        return this.normalizeFilterValue((value as any).$eq, tracker);
      }

      if ('$ne' in value) {
        const normalized = this.normalizeFilterValue(
          (value as any).$ne,
          tracker,
        );
        return normalized === undefined ? undefined : Not(normalized);
      }

      if (this.isPlainObject(value)) {
        const normalizedObject: Record<string, unknown> = {};
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          const normalizedNested = this.normalizeFilterValue(
            nestedValue,
            tracker,
          );
          if (normalizedNested === undefined && nestedValue !== undefined) {
            tracker.unsupported = true;
            return undefined;
          }
          normalizedObject[nestedKey] = normalizedNested;
        }
        return normalizedObject;
      }

      tracker.unsupported = true;
      return undefined;
    }

    tracker.unsupported = true;
    return undefined;
  }

  private ensureArray(value: unknown): unknown[] | null {
    if (Array.isArray(value)) {
      return value;
    }

    if (value === undefined) {
      return null;
    }

    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return [value];
    }

    return null;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    if (
      value instanceof FindOperator ||
      value === null ||
      Array.isArray(value) ||
      value instanceof Date
    ) {
      return false;
    }
    return (
      typeof value === 'object' &&
      Object.getPrototypeOf(value) === Object.prototype
    );
  }
}
