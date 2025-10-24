/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { join } from 'path';

import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttachmentModule } from '@/attachment/attachment.module';
import { LoggerModule } from '@/logger/logger.module';

import { MigrationCommand } from './migration.command';
import { MigrationOrmEntity } from './migration.entity';
import { MigrationService } from './migration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MigrationOrmEntity]),
    LoggerModule,
    HttpModule,
    AttachmentModule,
  ],
  providers: [
    MigrationService,
    MigrationCommand,
    {
      provide: 'TYPEORM_MIGRATION_DIR',
      useValue: join(__dirname, 'migrations'),
    },
  ],
  exports: [MigrationService],
})
export class MigrationModule {}
