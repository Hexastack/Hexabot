/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { DataSource, Entity, Column } from 'typeorm';
import { Exclude, Expose } from 'class-transformer';

import {
  BaseOrmEntity,
  BaseOrmRepository,
  BaseOrmService,
  BaseStub,
  DtoAction,
  DtoActionConfig,
  DtoTransformer,
  DtoTransformerConfig,
} from '../../src/database';

@Entity({ name: 'dummy_entities' })
export class DummyOrmEntity extends BaseOrmEntity {
  @Column()
  dummy!: string;

  @Column({ type: 'simple-json', nullable: true })
  dynamicField?: Record<string, unknown>;
}

@Exclude()
export class DummyStub extends BaseStub {
  @Expose()
  dummy!: string;

  @Expose()
  dynamicField?: Record<string, unknown>;
}

@Exclude()
export class Dummy extends DummyStub {}

export class DummyCreateDto {
  dummy!: string;
  dynamicField?: Record<string, unknown>;
}

export class DummyUpdateDto {
  dummy?: string;
  dynamicField?: Record<string, unknown>;
}

export type DummyTransformerDto = DtoTransformerConfig<{
  [DtoTransformer.PlainCls]: typeof Dummy;
  [DtoTransformer.FullCls]: typeof Dummy;
}>;

export type DummyDtoConfig = DtoActionConfig<{
  [DtoAction.Create]: DummyCreateDto;
  [DtoAction.Update]: DummyUpdateDto;
}>;

@Injectable()
export class DummyRepository extends BaseOrmRepository<
  DummyOrmEntity,
  DummyTransformerDto,
  DummyDtoConfig
> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(DummyOrmEntity), [], {
      PlainCls: Dummy,
      FullCls: Dummy,
    });
  }
}

@Injectable()
export class DummyService extends BaseOrmService<
  DummyOrmEntity,
  DummyTransformerDto,
  DummyDtoConfig,
  DummyRepository
> {
  constructor(readonly repository: DummyRepository) {
    super(repository);
  }
}

export const dummyFixtures: DummyCreateDto[] = [
  { dummy: 'dummy test 1' },
  { dummy: 'dummy test 2' },
  { dummy: 'dummy test 3' },
  { dummy: 'dummy test 4' },
];

export const seedDummyFixtures = async (
  dataSource: DataSource,
): Promise<DummyOrmEntity[]> => {
  const repository = dataSource.getRepository(DummyOrmEntity);
  await repository.clear();
  const entities = repository.create(dummyFixtures);
  return repository.save(entities);
};
