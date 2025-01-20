/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
