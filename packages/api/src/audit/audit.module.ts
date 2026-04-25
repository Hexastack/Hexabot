/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Request } from 'express';
import { AuditLogModule as SdkAuditLogModule } from 'nestjs-auditlog';
import { ClsModule, ClsService } from 'nestjs-cls';

import { AuditCoreModule } from './audit-core.module';
import { AuditLogController } from './controllers/audit-log.controller';
import { AuditBackendFactory } from './exporters/audit-backend.factory';
import { AuditContextInterceptor } from './interceptors/audit-context.interceptor';
import { AuditLogSubscriber } from './subscribers/audit-log.subscriber';
import { AuditClsStore } from './types/audit-context.type';
import {
  resolveRequestId,
  resolveRequestIp,
  resolveRequestPath,
  resolveUserAgent,
} from './utils/request-context';

@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) => resolveRequestId(req),
        setup: (cls: ClsService<AuditClsStore>, req: Request) => {
          cls.set('audit', {
            requestId: cls.getId() ?? resolveRequestId(req),
            ip: resolveRequestIp(req),
            userAgent: resolveUserAgent(req),
            method: req.method,
            path: resolveRequestPath(req),
          });
        },
      },
    }),
    AuditCoreModule,
    SdkAuditLogModule.forRootAsync({
      imports: [AuditCoreModule],
      inject: [AuditBackendFactory],
      useFactory: (factory: AuditBackendFactory) => ({
        exporter: factory.create(),
      }),
    }),
  ],
  controllers: [AuditLogController],
  providers: [
    AuditLogSubscriber,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditContextInterceptor,
    },
  ],
})
export class AuditModule {}
