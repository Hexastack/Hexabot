/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FindOperator } from 'typeorm';

import { TypeOrmSearchFilterPipe } from './typeorm-search-filter.pipe';

type TestEntity = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

describe('TypeOrmSearchFilterPipe', () => {
  const pipe = new TypeOrmSearchFilterPipe<TestEntity>({
    allowedFields: ['name', 'email'] as any,
    defaultSort: ['createdAt', 'desc'],
  });

  it('should transform equality filters into TypeORM where clause', async () => {
    const result = await pipe.transform(
      {
        where: { name: 'John Doe' },
      } as any,
      {} as any,
    );

    expect(result.where).toEqual({ name: 'John Doe' });
  });

  it('should create ILike operator for contains filters', async () => {
    const result = await pipe.transform(
      {
        where: { email: { contains: 'example' } },
      } as any,
      {} as any,
    );

    const where = result.where as Record<string, FindOperator<string>>;
    expect(where.email).toBeInstanceOf(FindOperator);
    expect(where.email.type).toBe('ilike');
  });

  it('should combine OR conditions into an array of where clauses', async () => {
    const result = await pipe.transform(
      {
        where: {
          or: [{ name: 'John' }, { email: { contains: 'example' } }],
        },
      } as any,
      {} as any,
    );

    expect(Array.isArray(result.where)).toBe(true);
    const [first, second] = result.where as Array<Record<string, unknown>>;
    expect(first).toEqual({ name: 'John' });
    expect(second.email).toBeInstanceOf(FindOperator);
  });

  it('should parse pagination parameters', async () => {
    const result = await pipe.transform(
      {
        where: {},
        skip: '5',
        limit: '10',
      } as any,
      {} as any,
    );

    expect(result.skip).toBe(5);
    expect(result.take).toBe(10);
  });

  it('should parse sort parameter and fallback to default sort', async () => {
    const withSort = await pipe.transform(
      {
        where: {},
        sort: 'name asc',
      } as any,
      {} as any,
    );

    expect(withSort.order).toEqual({ name: 'ASC' });

    const defaultSort = await pipe.transform(
      {
        where: {},
      } as any,
      {} as any,
    );

    expect(defaultSort.order).toEqual({ createdAt: 'DESC' });
  });
});
