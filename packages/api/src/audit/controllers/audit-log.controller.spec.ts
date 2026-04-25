/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ServiceUnavailableException } from '@nestjs/common';

import { AuditLogRecordService } from '../services/audit-log-record.service';

import { AuditLogController } from './audit-log.controller';

describe('AuditLogController', () => {
  it('returns service unavailable when audit records are not stored locally', async () => {
    const service = {
      assertReadableBackend: jest.fn(() => {
        throw new ServiceUnavailableException('No local backend');
      }),
    } as unknown as AuditLogRecordService;
    const controller = new AuditLogController(service);

    await expect(controller.findAuditLogs({})).rejects.toThrow(
      ServiceUnavailableException,
    );
    expect(service.assertReadableBackend).toHaveBeenCalledTimes(1);
  });
});
