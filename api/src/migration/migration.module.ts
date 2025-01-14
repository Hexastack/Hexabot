/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { join } from 'path';

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AttachmentModule } from '@/attachment/attachment.module';
import { LoggerModule } from '@/logger/logger.module';

import { MigrationCommand } from './migration.command';
import { MigrationModel } from './migration.schema';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    MongooseModule.forFeature([MigrationModel]),
    LoggerModule,
    HttpModule,
    AttachmentModule,
  ],
  providers: [
    MigrationService,
    MigrationCommand,
    {
      provide: 'MONGO_MIGRATION_DIR',
      useValue: join(__dirname, 'migrations'),
    },
  ],
  exports: [MigrationService],
})
export class MigrationModule {}
