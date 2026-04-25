/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogOrmEntity } from './entities/audit-log.entity';
import { AuditBackendFactory } from './exporters/audit-backend.factory';
import { AuditDatabaseExporter } from './exporters/audit-database.exporter';
import { AuditLogRepository } from './repositories/audit-log.repository';
import { AuditContextService } from './services/audit-context.service';
import { AuditLogRecordService } from './services/audit-log-record.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogOrmEntity])],
  providers: [
    AuditBackendFactory,
    AuditContextService,
    AuditDatabaseExporter,
    AuditLogRecordService,
    AuditLogRepository,
  ],
  exports: [
    AuditBackendFactory,
    AuditContextService,
    AuditLogRecordService,
    AuditLogRepository,
  ],
})
export class AuditCoreModule {}
