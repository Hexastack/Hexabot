/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { DummyCreateDto } from '@/utils/test/dummy/dto/dummy.dto';
import { DummyOrmEntity } from '@/utils/test/dummy/entities/dummy.entity';

export const dummyFixtures: DummyCreateDto[] = [
  {
    dummy: 'dummy test 1',
  },
  {
    dummy: 'dummy test 2',
  },
  {
    dummy: 'dummy test 3',
  },
  {
    dummy: 'dummy test 4',
  },
];

export const installDummyFixturesTypeOrm = async (
  dataSource: DataSource,
): Promise<DummyOrmEntity[]> => {
  const repository = dataSource.getRepository(DummyOrmEntity);
  const entities = repository.create(dummyFixtures);
  return await repository.save(entities);
};
