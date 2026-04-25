/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { IAuditLog, IAuditLogExporter } from 'nestjs-auditlog';
import { DataSource } from 'typeorm';

import { AuditLogOrmEntity } from '../entities/audit-log.entity';
import { AuditContextService } from '../services/audit-context.service';

const normalizeAuditValue = (
  value: string | string[] | undefined,
  fallback: string,
): string => {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  return value ?? fallback;
};
const normalizeAuditLabel = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    return value.join(',');
  }

  return typeof value === 'string' && value.length > 0 ? value : null;
};

@Injectable()
export class AuditDatabaseExporter implements IAuditLogExporter {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly auditContext: AuditContextService,
  ) {}

  async startup(): Promise<void> {
    return;
  }

  async shutdown(): Promise<void> {
    return;
  }

  async sendAuditLog(log: IAuditLog): Promise<void> {
    const context = this.auditContext.getContext();
    const repository = this.dataSource.getRepository(AuditLogOrmEntity);
    const actorLabel =
      normalizeAuditLabel((log.actor as { label?: unknown }).label) ??
      context.actorLabel ??
      null;
    const resourceType = log.resource.type || 'unknown';
    const resourceLabel =
      normalizeAuditLabel((log.resource as { label?: unknown }).label) ??
      (resourceType === 'Auth' ? actorLabel : null);
    const record = repository.create({
      resourceId: normalizeAuditValue(log.resource.id, 'unknown'),
      resourceType,
      resourceLabel,
      operationId: normalizeAuditValue(log.operation.id, 'unknown'),
      operationType: log.operation.type || 'unknown',
      operationStatus: log.operation.status ?? 'UNSPECIFIED',
      actorId: normalizeAuditValue(log.actor.id, context.actorId ?? 'system'),
      actorType: normalizeAuditValue(
        log.actor.type as unknown as string | string[] | undefined,
        context.actorType ?? 'system',
      ),
      actorLabel,
      actorIp: log.actor.ip ?? context.ip ?? null,
      actorAgent: log.actor.agent ?? context.userAgent ?? null,
      requestId: context.requestId ?? null,
      requestMethod: context.method ?? null,
      requestPath: context.path ?? null,
      dataBefore: log.data_diff?.before ?? null,
      dataAfter: log.data_diff?.after ?? null,
      dataDiff: log.data_diff?.diff ?? null,
      raw: log,
    });

    await repository.save(record);
  }

  customLoggerBodyTransformation(log: IAuditLog): string {
    return JSON.stringify(log);
  }

  clone(): IAuditLogExporter {
    return this;
  }
}
