/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  AuditLogService as SdkAuditLogService,
  IAuditLog,
} from 'nestjs-auditlog';
import { DataSource } from 'typeorm';

import { config } from '@/config';
import { DummyOrmEntity } from '@/utils/test/dummy/entities/dummy.entity';

import { AuditLogOrmEntity } from '../entities/audit-log.entity';
import { AuditDatabaseExporter } from '../exporters/audit-database.exporter';
import { AuditContextService } from '../services/audit-context.service';

import { AuditLogSubscriber } from './audit-log.subscriber';

describe('AuditLogSubscriber integration', () => {
  const originalAudit = { ...config.audit };
  let dataSource: DataSource;

  beforeEach(async () => {
    config.audit = {
      ...originalAudit,
      enabled: true,
      backend: 'database',
      maskFields: ['value'],
    };
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      dropSchema: true,
      logging: false,
      entities: [DummyOrmEntity, AuditLogOrmEntity],
    });
    await dataSource.initialize();

    const auditContext = {
      getContext: jest.fn().mockReturnValue({
        requestId: 'req-integration',
        actorId: 'admin-1',
        actorType: 'admin',
        ip: '203.0.113.1',
        userAgent: 'jest',
        method: 'POST',
        path: '/api/dummy',
      }),
    } as unknown as AuditContextService;
    const databaseExporter = new AuditDatabaseExporter(
      dataSource,
      auditContext,
    );
    const sdkAuditLogService = {
      sendAuditLog: jest.fn((log: IAuditLog) =>
        databaseExporter.sendAuditLog(log),
      ),
    } as unknown as SdkAuditLogService;

    new AuditLogSubscriber(dataSource, sdkAuditLogService, auditContext);
  });

  afterEach(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    config.audit = { ...originalAudit };
  });

  it('persists create, update, and remove audit records from TypeORM events', async () => {
    const dummyRepository = dataSource.getRepository(DummyOrmEntity);
    const auditRepository = dataSource.getRepository(AuditLogOrmEntity);
    const created = await dummyRepository.save(
      dummyRepository.create({
        dummy: 'audit me',
        dynamicField: { value: 'secret', visible: true },
      }),
    );
    await dummyRepository.save({ ...created, dummy: 'audit me updated' });
    await dummyRepository.remove(created);

    const records = await auditRepository.find({
      order: { createdAt: 'ASC' },
    });

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.operationType)).toEqual([
      'Create',
      'Update',
      'Remove',
    ]);
    expect(records[0]).toMatchObject({
      resourceType: 'Dummy',
      actorId: 'admin-1',
      actorIp: '203.0.113.1',
      requestId: 'req-integration',
      requestPath: '/api/dummy',
    });
    expect(records[0].dataAfter).toMatchObject({
      dummy: 'audit me',
      dynamicField: {
        value: '[REDACTED]',
        visible: true,
      },
    });
    expect(records[1].dataDiff).toMatchObject({
      dummy: {
        after: 'audit me updated',
      },
    });
  });
});
