/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { AuditLogService as SdkAuditLogService } from 'nestjs-auditlog';
import { DataSource, InsertEvent, ObjectLiteral } from 'typeorm';

import { config } from '@/config';

import { AuditContextService } from '../services/audit-context.service';

import { AuditLogSubscriber } from './audit-log.subscriber';

const createColumn = (propertyName: string) => ({
  propertyName,
  getEntityValue: (entity: ObjectLiteral) => entity[propertyName],
});
const createRelation = (propertyName: string) => ({
  propertyName,
  getEntityValue: (entity: ObjectLiteral) => entity[propertyName],
});

describe('AuditLogSubscriber', () => {
  const originalAudit = { ...config.audit };
  let dataSource: DataSource;
  let sdkAuditLogService: jest.Mocked<Pick<SdkAuditLogService, 'sendAuditLog'>>;
  let auditContext: jest.Mocked<Pick<AuditContextService, 'getContext'>>;
  let subscriber: AuditLogSubscriber;

  beforeEach(() => {
    config.audit = {
      ...originalAudit,
      enabled: true,
      maskFields: ['password', 'value'],
    };
    dataSource = { subscribers: [] } as unknown as DataSource;
    sdkAuditLogService = {
      sendAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    auditContext = {
      getContext: jest.fn().mockReturnValue({
        actorId: 'admin-1',
        actorType: 'admin',
        ip: '203.0.113.1',
        userAgent: 'browser',
      }),
    };
    subscriber = new AuditLogSubscriber(
      dataSource,
      sdkAuditLogService as unknown as SdkAuditLogService,
      auditContext as unknown as AuditContextService,
    );
  });

  afterEach(() => {
    config.audit = { ...originalAudit };
    jest.restoreAllMocks();
  });

  it('registers itself once in datasource subscribers', () => {
    expect(dataSource.subscribers).toEqual([subscriber]);

    (subscriber as any).registerAsSubscriber();

    expect(dataSource.subscribers).toHaveLength(1);
  });

  it('skips internal audit tables', async () => {
    await subscriber.afterInsert({
      metadata: {
        tableName: 'audit_logs',
      },
    } as InsertEvent<ObjectLiteral>);

    expect(sdkAuditLogService.sendAuditLog).not.toHaveBeenCalled();
  });

  it('emits masked create audit logs with request actor metadata', async () => {
    await subscriber.afterInsert({
      metadata: {
        tableName: 'users',
        targetName: 'UserOrmEntity',
        name: 'UserOrmEntity',
        primaryColumns: [{ propertyName: 'id' }],
        columns: [
          createColumn('id'),
          createColumn('email'),
          createColumn('password'),
        ],
        relations: [createRelation('roles')],
      },
      entity: {
        id: 'user-1',
        email: 'user@example.com',
        password: 'secret',
        roles: [{ id: 'role-1', name: 'admin' }],
      },
    } as unknown as InsertEvent<ObjectLiteral>);

    expect(sdkAuditLogService.sendAuditLog).toHaveBeenCalledWith({
      resource: {
        id: 'user-1',
        type: 'User',
      },
      operation: {
        id: 'typeorm.User.create',
        type: 'Create',
        status: 'SUCCEEDED',
      },
      actor: {
        id: 'admin-1',
        type: 'admin',
        ip: '203.0.113.1',
        agent: 'browser',
      },
      data_diff: {
        before: null,
        after: {
          id: 'user-1',
          email: 'user@example.com',
          password: '[REDACTED]',
          roles: ['role-1'],
        },
        diff: {
          id: { before: null, after: 'user-1' },
          email: { before: null, after: 'user@example.com' },
          password: { before: null, after: '[REDACTED]' },
          roles: { before: null, after: ['role-1'] },
        },
      },
    });
  });
});
