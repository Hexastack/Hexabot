/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { join } from 'path';

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LoggerModule } from '@/logger/logger.module';

import { MigrationCommand } from './migration.command';
import { Migration, MigrationSchema } from './migration.schema';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Migration.name, schema: MigrationSchema },
    ]),
    LoggerModule,
  ],
  providers: [
    MigrationService,
    MigrationCommand,
    {
      provide: 'MONGO_MIGRATION_DIR',
      useValue: join(process.cwd(), 'src', 'migration', 'migrations'),
    },
  ],
  exports: [MigrationService],
})
export class MigrationModule {}
