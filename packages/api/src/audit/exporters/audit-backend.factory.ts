/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import {
  AuditlogClickHouseExporter,
  AuditlogOltpGrpcExporter,
  AuditlogOltpHttpExporter,
  IAuditLogExporter,
} from 'nestjs-auditlog';

import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';

import { AuditDatabaseExporter } from './audit-database.exporter';
import { AuditNoopExporter } from './audit-noop.exporter';
import { AuditSafeExporter } from './audit-safe.exporter';

@Injectable()
export class AuditBackendFactory {
  constructor(
    private readonly databaseExporter: AuditDatabaseExporter,
    private readonly logger: LoggerService,
  ) {}

  create(): IAuditLogExporter {
    const exporter = config.audit.enabled
      ? this.createConfiguredExporter()
      : new AuditNoopExporter();

    return new AuditSafeExporter(
      exporter,
      config.audit.failClosed,
      this.logger,
    );
  }

  private createConfiguredExporter(): IAuditLogExporter {
    const { audit } = config;

    switch (audit.backend) {
      case 'database':
        return this.databaseExporter;
      case 'opentelemetry-http':
        return new AuditlogOltpHttpExporter(
          audit.serviceName,
          audit.serviceNamespace,
          audit.opentelemetry,
          audit.serviceEnvironmentName,
        );
      case 'opentelemetry-grpc':
        return new AuditlogOltpGrpcExporter(
          audit.serviceName,
          audit.serviceNamespace,
          audit.opentelemetry,
          audit.serviceEnvironmentName,
        );
      case 'clickhouse':
        return new AuditlogClickHouseExporter({
          serviceName: audit.serviceName,
          serviceNamespace: audit.serviceNamespace,
          serviceEnvironmentName: audit.serviceEnvironmentName,
          clickHouseUrl: audit.clickhouse.url,
          databaseName: audit.clickhouse.databaseName,
          logExpired: audit.clickhouse.logExpired,
        });
      default:
        throw new Error(`Unsupported audit log backend: ${audit.backend}`);
    }
  }
}
