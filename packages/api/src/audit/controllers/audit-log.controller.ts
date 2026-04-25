/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AuditLog, AuditLogFull } from '@hexabot-ai/types';
import { Controller, Get, Query } from '@nestjs/common';
import { FindManyOptions } from 'typeorm';

import { UuidParam } from '@/utils';
import { BaseOrmController } from '@/utils/generics/base-orm.controller';
import { TypeOrmSearchFilterPipe } from '@/utils/pipes/typeorm-search-filter.pipe';
import { TFilterNestedKeysOfType } from '@/utils/types/filter.types';

import {
  AuditLogReadMany,
  AuditLogReadOne,
} from '../decorators/audit-log.decorators';
import { AuditLogOrmEntity } from '../entities/audit-log.entity';
import { AuditLogRecordService } from '../services/audit-log-record.service';

export const AUDIT_LOG_ALLOWED_FILTER_FIELDS: TFilterNestedKeysOfType<AuditLogOrmEntity>[] =
  [
    'resourceId',
    'resourceType',
    'operationId',
    'operationType',
    'operationStatus',
    'actorId',
    'actorType',
    'actorIp',
    'requestId',
    'requestMethod',
    'requestPath',
  ];

@Controller('auditlog')
export class AuditLogController extends BaseOrmController<AuditLogOrmEntity> {
  constructor(private readonly auditLogService: AuditLogRecordService) {
    super(auditLogService);
  }

  @AuditLogReadMany()
  @Get()
  async findAuditLogs(
    @Query(
      new TypeOrmSearchFilterPipe<AuditLogOrmEntity>({
        allowedFields: AUDIT_LOG_ALLOWED_FILTER_FIELDS,
        defaultSort: ['createdAt', 'desc'],
      }),
    )
    options: FindManyOptions<AuditLogOrmEntity> = {},
  ): Promise<AuditLog[] | AuditLogFull[]> {
    this.auditLogService.assertReadableBackend();

    return await this.find(options);
  }

  @AuditLogReadMany()
  @Get('count')
  async filterCount(
    @Query(
      new TypeOrmSearchFilterPipe<AuditLogOrmEntity>({
        allowedFields: AUDIT_LOG_ALLOWED_FILTER_FIELDS,
      }),
    )
    options: FindManyOptions<AuditLogOrmEntity> = {},
  ): Promise<{ count: number }> {
    this.auditLogService.assertReadableBackend();

    return await this.count(options);
  }

  @AuditLogReadOne()
  @Get(':id')
  async findAuditLog(@UuidParam('id') id: string): Promise<AuditLog> {
    this.auditLogService.assertReadableBackend();

    return await this.findOne(id);
  }
}
