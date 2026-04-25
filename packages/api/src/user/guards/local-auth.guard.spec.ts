/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';
import { AuditLogService as SdkAuditLogService } from 'nestjs-auditlog';

import { AuditContextService } from '@/audit/services/audit-context.service';

import { LocalAuthGuard } from './local-auth.guard';

describe('LocalAuthGuard', () => {
  const baseGuardPrototype = Object.getPrototypeOf(
    LocalAuthGuard.prototype,
  ) as {
    canActivate: (context: ExecutionContext) => Promise<boolean>;
    logIn: (request: Request) => Promise<void>;
  };
  const createContext = (request: Partial<Request>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('audits failed local login attempts before rethrowing the auth failure', async () => {
    const error = new UnauthorizedException(
      'Unable to login, check credentials',
    );
    const auditLogService = {
      sendAuditLog: jest.fn().mockResolvedValue(undefined),
    };
    const auditContextService = {
      setFromRequest: jest.fn(),
    };
    const moduleRef = {
      get: jest.fn((token) => {
        if (token === SdkAuditLogService) {
          return auditLogService;
        }
        if (token === AuditContextService) {
          return auditContextService;
        }

        throw new Error('Unknown provider');
      }),
    } as unknown as ModuleRef;
    const guard = new LocalAuthGuard(
      { session: true } as AuthModuleOptions,
      moduleRef,
    );
    const request = {
      body: {
        identifier: ' admin@example.com ',
        password: 'secret',
      },
      headers: {
        'user-agent': 'jest',
        'x-forwarded-for': '203.0.113.1',
      },
      method: 'POST',
      originalUrl: '/api/auth/local',
    } as Partial<Request>;
    const context = createContext(request);
    const canActivateSpy = jest
      .spyOn(baseGuardPrototype, 'canActivate')
      .mockRejectedValue(error);
    const logInSpy = jest
      .spyOn(baseGuardPrototype, 'logIn')
      .mockResolvedValue(undefined);

    await expect(guard.canActivate(context)).rejects.toBe(error);

    expect(canActivateSpy).toHaveBeenCalledWith(context);
    expect(logInSpy).not.toHaveBeenCalled();
    expect(auditContextService.setFromRequest).toHaveBeenCalledWith(request);
    expect(auditLogService.sendAuditLog).toHaveBeenCalledWith({
      resource: {
        id: 'admin@example.com',
        type: 'Auth',
        label: 'admin@example.com',
      },
      operation: {
        id: 'auth.login',
        type: 'Login',
        status: 'FAILED',
      },
      actor: {
        id: 'admin@example.com',
        type: 'user',
        label: 'admin@example.com',
        ip: '203.0.113.1',
        agent: 'jest',
      },
    });
  });
});
