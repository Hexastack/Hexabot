/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  FindManyOptions,
  FindOperator,
  FindOptionsOrder,
  FindOptionsWhere
} from 'typeorm';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';

import { LegacyQueryConverter } from './legacy-query.converter';

interface TestEntity {
  id: string;
  status: string;
  count: number;
  createdAt: Date;
  flag: boolean;
  nullable?: string | null;
  nested: {
    inner: string;
    deep: {
      value: number;
    };
  };
}

const expectFindOperator = (
  value: unknown,
  expectedType: string,
  expectedValue: unknown,
) => {
  const operator = value as FindOperator<any>;
  expect(operator).toBeInstanceOf(FindOperator);
  expect(operator.type).toBe(expectedType);
  expect(operator.value).toEqual(expectedValue);
};

describe('LegacyQueryConverter', () => {
  let sortNormalizer: jest.Mock<
    FindOptionsOrder<TestEntity> | undefined,
    [QuerySortDto<TestEntity> | undefined]
  >;
  let converter: LegacyQueryConverter<TestEntity>;

  beforeEach(() => {
    sortNormalizer = jest.fn();
    converter = new LegacyQueryConverter<TestEntity>(sortNormalizer);
  });

  describe('convertFilter', () => {
    it('returns undefined filter when input is empty', () => {
      const emptyObjectResult = converter.convertFilter(
        {} as FindOptionsWhere<TestEntity>,
      );
      const nullResult = converter.convertFilter(
        undefined as unknown as FindOptionsWhere<TestEntity>,
      );

      expect(emptyObjectResult).toEqual({
        where: undefined,
        fullyHandled: true,
      });
      expect(nullResult).toEqual({
        where: undefined,
        fullyHandled: true,
      });
    });

    it('maps simple primitive filters without altering values', () => {
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const result = converter.convertFilter({
        status: 'active',
        count: 42,
        flag: true,
        createdAt,
        nullable: null,
      } as unknown as FindOptionsWhere<TestEntity>);

      expect(result.fullyHandled).toBe(true);
      expect(result.where).toEqual({
        status: 'active',
        count: 42,
        flag: true,
        createdAt,
        nullable: null,
      });
    });

    it('builds nested where clauses when dot notation is used', () => {
      const result = converter.convertFilter({
        'nested.inner': 'value',
        'nested.deep.value': 5,
      } as unknown as FindOptionsWhere<TestEntity>);

      expect(result.fullyHandled).toBe(true);
      expect(result.where).toEqual({
        nested: { inner: 'value', deep: { value: 5 } },
      });
    });

    it('combines $and filters and converts operators', () => {
      const result = converter.convertFilter({
        $and: [
          { status: 'active' },
          { count: { $ne: 0 } },
          { status: ['active', 'pending'] },
        ],
      } as unknown as FindOptionsWhere<TestEntity>);

      expect(result.fullyHandled).toBe(true);
      expect(result.where).toBeDefined();
      const clause = result.where as FindOptionsWhere<TestEntity>;
      expect(clause.status).toBeDefined();
      expectFindOperator(clause.status, 'in', ['active', 'pending']);
      const countOperator = clause.count as FindOperator<any>;
      expect(countOperator.type).toBe('not');
      expect(countOperator.value).toBe(0);
    });

    it('expands $or clauses into an array of where options', () => {
      const result = converter.convertFilter({
        $or: [{ status: 'active' }, { status: 'pending' }],
      } as unknown as FindOptionsWhere<TestEntity>);

      expect(result.fullyHandled).toBe(true);
      const clauses = result.where as FindOptionsWhere<TestEntity>[];
      expect(Array.isArray(clauses)).toBe(true);
      expect(clauses).toHaveLength(2);
      expect(clauses[0]).toEqual({ status: 'active' });
      expect(clauses[1]).toEqual({ status: 'pending' });
    });

    it('translates root arrays into AND combinations', () => {
      const result = converter.convertFilter([
        { status: 'active' },
        { $or: [{ count: 1 }, { count: 2 }] },
      ] as unknown as FindOptionsWhere<TestEntity>);

      expect(result.fullyHandled).toBe(true);
      const clauses = result.where as FindOptionsWhere<TestEntity>[];
      expect(clauses).toHaveLength(2);
      expect(clauses).toEqual([
        { status: 'active', count: 1 },
        { status: 'active', count: 2 },
      ]);
    });

    it('handles $in and $nin operators, coercing scalar values into arrays', () => {
      const result = converter.convertFilter({
        status: { $in: 'active' },
        count: { $nin: 5 },
      } as unknown as FindOptionsWhere<TestEntity>);

      expect(result.fullyHandled).toBe(true);
      const clause = result.where as FindOptionsWhere<TestEntity>;
      expectFindOperator(clause.status, 'in', ['active']);
      const countOperator = clause.count as FindOperator<any>;
      expect(countOperator.type).toBe('not');
      expect(countOperator.child).toBeInstanceOf(FindOperator);
      expect(countOperator.child?.type).toBe('in');
      expect(countOperator.child?.value).toEqual([5]);
    });

    it('marks unsupported operators while keeping supported parts', () => {
      const result = converter.convertFilter({
        status: 'active',
        $unsupported: 'value',
      } as unknown as FindOptionsWhere<TestEntity>);

      expect(result.fullyHandled).toBe(false);
      expect(result.where).toEqual({ status: 'active' });
    });

    it('flags $nor operators as unsupported', () => {
      const result = converter.convertFilter({
        $nor: [{ status: 'active' }],
      } as unknown as FindOptionsWhere<TestEntity>);

      expect(result.fullyHandled).toBe(false);
      expect(result.where).toBeUndefined();
    });
  });

  describe('buildFindOptionsFromLegacyArgs', () => {
    it('applies filter conversion, pagination and sorting', () => {
      const createdAt = new Date('2024-01-01T00:00:00.000Z');
      const pageQuery: PageQueryDto<TestEntity> = {
        skip: 10,
        limit: 20,
        sort: ['createdAt', 'desc'] as QuerySortDto<TestEntity>,
      };
      const filter = {
        createdAt,
      } as unknown as FindOptionsWhere<TestEntity>;
      sortNormalizer.mockReturnValueOnce({ createdAt: 'DESC' });

      const baseOptions: FindManyOptions<TestEntity> = {
        relations: { nested: true } as any,
      };

      const { options, fullyHandled } =
        converter.buildFindOptionsFromLegacyArgs(
          filter,
          pageQuery,
          baseOptions,
        );

      expect(fullyHandled).toBe(true);
      expect(options.where).toEqual({ createdAt });
      expect(options.skip).toBe(10);
      expect(options.take).toBe(20);
      expect(options.order).toEqual({ createdAt: 'DESC' });
      expect(options.relations).toEqual({ nested: true });
      expect(sortNormalizer).toHaveBeenCalledWith(pageQuery.sort);
    });

    it('propagates unsupported state from filter conversion', () => {
      const filter = {
        $nor: [{ status: 'inactive' }],
      } as unknown as FindOptionsWhere<TestEntity>;
      const baseOptions: FindManyOptions<TestEntity> = { cache: true };

      const { fullyHandled, options } =
        converter.buildFindOptionsFromLegacyArgs(
          filter,
          undefined,
          baseOptions,
        );

      expect(fullyHandled).toBe(false);
      expect(options.where).toBeUndefined();
      expect(options.cache).toBe(true);
      expect(sortNormalizer).not.toHaveBeenCalled();
    });
  });
});
