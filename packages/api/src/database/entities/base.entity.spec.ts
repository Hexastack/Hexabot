/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import type { TZodDto } from '@/utils/types/dto.types';

import { BaseOrmEntity } from './base.entity';

const plainSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  name: z.string(),
});
const fullSchema = plainSchema.extend({
  details: z.string().nullable(),
});

type TestDto = TZodDto<
  {
    plain: typeof plainSchema;
    full: typeof fullSchema;
  },
  {}
>;

class TestOrmEntity extends BaseOrmEntity<TestDto> {
  plainCls = plainSchema;

  fullCls = fullSchema;

  name!: string;

  details!: string | null;

  hidden!: string;
}

class LegacyOutputDto {}

const buildEntity = (): TestOrmEntity => {
  const entity = new TestOrmEntity();
  entity.id = 'entity-id';
  entity.createdAt = new Date('2025-01-01T10:00:00.000Z');
  entity.updatedAt = new Date('2025-01-01T11:00:00.000Z');
  entity.name = 'entity-name';
  entity.details = 'entity-details';
  entity.hidden = 'secret';

  return entity;
};

describe('BaseOrmEntity', () => {
  it('should transform plain output using zod schema only', () => {
    const entity = buildEntity();

    expect(entity.toPlainCls()).toEqual({
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      name: entity.name,
    });
  });

  it('should transform full output using zod schema only', () => {
    const entity = buildEntity();

    expect(entity.toFullCls()).toEqual({
      id: entity.id,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      name: entity.name,
      details: entity.details,
    });
  });

  it('should fail fast when plainCls target is not a zod schema', () => {
    const entity = buildEntity();
    (entity as { plainCls: unknown }).plainCls = LegacyOutputDto;

    expect(() => entity.toPlainCls()).toThrow(
      '[BaseOrmEntity] TestOrmEntity.plainCls must be a zod schema (must expose parse and safeParse). Received: LegacyOutputDto.',
    );
  });

  it('should fail fast when fullCls target is not a zod schema', () => {
    const entity = buildEntity();
    (entity as { fullCls: unknown }).fullCls = LegacyOutputDto;

    expect(() => entity.toFullCls()).toThrow(
      '[BaseOrmEntity] TestOrmEntity.fullCls must be a zod schema (must expose parse and safeParse). Received: LegacyOutputDto.',
    );
  });
});
