/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IAuditLogExporter } from 'nestjs-auditlog';

import { LoggerService } from '@/logger/logger.service';

import { AuditSafeExporter } from './audit-safe.exporter';

const createDelegate = (): jest.Mocked<IAuditLogExporter> =>
  ({
    startup: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
    sendAuditLog: jest.fn().mockResolvedValue(undefined),
    customLoggerBodyTransformation: jest.fn().mockReturnValue('log'),
    clone: jest.fn(),
  }) as unknown as jest.Mocked<IAuditLogExporter>;

describe('AuditSafeExporter', () => {
  const log = {
    resource: { id: '1', type: 'User' },
    operation: { id: 'op', type: 'Update' },
    actor: { id: 'admin', type: 'admin' },
  };

  it('swallows delegate failures when failClosed is false', async () => {
    const delegate = createDelegate();
    const error = new Error('export failed');
    delegate.sendAuditLog.mockRejectedValue(error);
    const logger = { warn: jest.fn() } as unknown as LoggerService;
    const exporter = new AuditSafeExporter(delegate, false, logger);

    await expect(exporter.sendAuditLog(log)).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith('Audit log export failed', error);
  });

  it('rethrows delegate failures when failClosed is true', async () => {
    const delegate = createDelegate();
    const error = new Error('export failed');
    delegate.sendAuditLog.mockRejectedValue(error);
    const logger = { warn: jest.fn() } as unknown as LoggerService;
    const exporter = new AuditSafeExporter(delegate, true, logger);

    await expect(exporter.sendAuditLog(log)).rejects.toThrow(error);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});
