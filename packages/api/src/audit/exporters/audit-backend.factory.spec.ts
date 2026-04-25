/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';

import { AuditBackendFactory } from './audit-backend.factory';
import { AuditDatabaseExporter } from './audit-database.exporter';

describe('AuditBackendFactory', () => {
  const originalAudit = { ...config.audit };

  afterEach(() => {
    config.audit = { ...originalAudit };
    jest.restoreAllMocks();
  });

  it('uses the database exporter for the database backend', async () => {
    config.audit.enabled = true;
    config.audit.backend = 'database';
    const databaseExporter = {
      startup: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      sendAuditLog: jest.fn().mockResolvedValue(undefined),
      customLoggerBodyTransformation: jest.fn(),
      clone: jest.fn(),
    } as unknown as AuditDatabaseExporter;
    const factory = new AuditBackendFactory(databaseExporter, {
      warn: jest.fn(),
    } as unknown as LoggerService);

    await factory.create().sendAuditLog({
      resource: { id: '1', type: 'User' },
      operation: { id: 'op', type: 'Update' },
      actor: { id: 'admin', type: 'admin' },
    });

    expect(databaseExporter.sendAuditLog).toHaveBeenCalledTimes(1);
  });

  it('rejects unsupported backends', () => {
    config.audit.enabled = true;
    config.audit.backend = 'unknown' as typeof config.audit.backend;
    const factory = new AuditBackendFactory(
      {} as AuditDatabaseExporter,
      { warn: jest.fn() } as unknown as LoggerService,
    );

    expect(() => factory.create()).toThrow(
      'Unsupported audit log backend: unknown',
    );
  });
});
