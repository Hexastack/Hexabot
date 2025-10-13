/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { Migration, MigrationModel } from '@/migration/migration.schema';
import { MigrationAction } from '@/migration/types';

const migrationFixtures: Migration[] = [
  {
    version: 'v2.1.2',
    status: MigrationAction.UP,
  },
  {
    version: 'v2.1.1',
    status: MigrationAction.DOWN,
  },
];

export const installMigrationFixtures = async () => {
  const Migration = mongoose.model(MigrationModel.name, MigrationModel.schema);
  return await Migration.insertMany(migrationFixtures);
};
