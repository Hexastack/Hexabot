/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FindOperator } from 'typeorm';

import { AuditLogRepository } from '../repositories/audit-log.repository';

import { AuditLogRecordService } from './audit-log-record.service';

describe('AuditLogRecordService', () => {
  it('applies default visibility filters to list queries', async () => {
    const repository = {
      find: jest.fn().mockResolvedValue([]),
    } as unknown as AuditLogRepository;
    const service = new AuditLogRecordService(repository);

    await service.find({
      where: [{ actorId: 'admin-1' }, { requestPath: '/api/workflow' }],
    });

    expect(repository.find).toHaveBeenCalledWith({
      where: [
        expect.objectContaining({
          actorId: 'admin-1',
          resourceType: expect.any(FindOperator),
        }),
        expect.objectContaining({
          requestPath: '/api/workflow',
          resourceType: expect.any(FindOperator),
        }),
      ],
    });
  });

  it('applies default visibility filters to count queries', async () => {
    const repository = {
      count: jest.fn().mockResolvedValue(0),
    } as unknown as AuditLogRepository;
    const service = new AuditLogRecordService(repository);

    await service.count({ where: { operationStatus: 'SUCCEEDED' } });

    expect(repository.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        operationStatus: 'SUCCEEDED',
        resourceType: expect.any(FindOperator),
      }),
    });
  });
});
