/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { MigrationOrmEntity } from '@hexabot/migration/migration.entity';
import { MigrationAction } from '@hexabot/migration/types';

const migrationFixtures: Array<Partial<MigrationOrmEntity>> = [
  {
    version: 'v3.0.2',
    status: MigrationAction.UP,
  },
  {
    version: 'v3.0.1',
    status: MigrationAction.DOWN,
  },
];

export const installMigrationFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(MigrationOrmEntity);
  const entities = repository.create(migrationFixtures);

  return await repository.save(entities);
};
