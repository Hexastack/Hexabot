/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IAuditLog } from 'nestjs-auditlog';
import { DataSource } from 'typeorm';

import { AuditContextService } from '../services/audit-context.service';

import { AuditDatabaseExporter } from './audit-database.exporter';

describe('AuditDatabaseExporter', () => {
  it('maps SDK payloads and request context to local audit records', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const create = jest.fn((record) => ({ id: 'record-1', ...record }));
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({ create, save }),
    } as unknown as DataSource;
    const auditContext = {
      getContext: jest.fn().mockReturnValue({
        requestId: 'request-1',
        method: 'PATCH',
        path: '/api/user/1',
      }),
    } as unknown as AuditContextService;
    const exporter = new AuditDatabaseExporter(dataSource, auditContext);
    const log: IAuditLog = {
      resource: {
        id: 'user-1',
        type: 'User',
        label: 'admin',
      } as IAuditLog['resource'] & { label: string },
      operation: {
        id: 'typeorm.User.update',
        type: 'Update',
        status: 'SUCCEEDED',
      },
      actor: {
        id: 'admin-1',
        type: 'admin',
        label: 'Admin User (admin)',
        ip: '203.0.113.1',
        agent: 'browser',
      } as IAuditLog['actor'] & { label: string },
      data_diff: {
        before: { email: 'old@example.com' },
        after: { email: 'new@example.com' },
        diff: {
          email: {
            before: 'old@example.com',
            after: 'new@example.com',
          },
        },
      },
    };

    await exporter.sendAuditLog(log);

    expect(create).toHaveBeenCalledWith({
      resourceId: 'user-1',
      resourceType: 'User',
      resourceLabel: 'admin',
      operationId: 'typeorm.User.update',
      operationType: 'Update',
      operationStatus: 'SUCCEEDED',
      actorId: 'admin-1',
      actorType: 'admin',
      actorLabel: 'Admin User (admin)',
      actorIp: '203.0.113.1',
      actorAgent: 'browser',
      requestId: 'request-1',
      requestMethod: 'PATCH',
      requestPath: '/api/user/1',
      dataBefore: { email: 'old@example.com' },
      dataAfter: { email: 'new@example.com' },
      dataDiff: {
        email: {
          before: 'old@example.com',
          after: 'new@example.com',
        },
      },
      raw: log,
    });
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'record-1' }),
    );
  });

  it('uses the actor label as the auth resource label when none is provided', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const create = jest.fn((record) => ({ id: 'record-1', ...record }));
    const dataSource = {
      getRepository: jest.fn().mockReturnValue({ create, save }),
    } as unknown as DataSource;
    const auditContext = {
      getContext: jest.fn().mockReturnValue({
        actorLabel: 'Admin User (admin)',
      }),
    } as unknown as AuditContextService;
    const exporter = new AuditDatabaseExporter(dataSource, auditContext);
    const log: IAuditLog = {
      resource: {
        id: 'admin-1',
        type: 'Auth',
      },
      operation: {
        id: 'auth.login',
        type: 'Login',
        status: 'SUCCEEDED',
      },
      actor: {
        id: 'admin-1',
        type: 'admin',
      },
    };

    await exporter.sendAuditLog(log);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        resourceLabel: 'Admin User (admin)',
        actorLabel: 'Admin User (admin)',
      }),
    );
  });
});
