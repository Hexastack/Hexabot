/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { AuthGuard, AuthModuleOptions } from '@nestjs/passport';
import { Request } from 'express';
import {
  AuditLogService as SdkAuditLogService,
  IAuditLog,
} from 'nestjs-auditlog';

import { AuditContextService } from '@/audit/services/audit-context.service';
import {
  resolveRequestIp,
  resolveUserAgent,
} from '@/audit/utils/request-context';

const UNKNOWN_VALUE = 'unknown';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  constructor(
    @Optional()
    @Inject(AuthModuleOptions)
    options: AuthModuleOptions | undefined,
    private readonly moduleRef: ModuleRef,
  ) {
    super(options);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = (await super.canActivate(context)) as boolean;
      await super.logIn(context.switchToHttp().getRequest());

      return result;
    } catch (error) {
      await this.recordFailedLogin(context);

      throw error;
    }
  }

  private async recordFailedLogin(context: ExecutionContext): Promise<void> {
    const request = context.switchToHttp().getRequest<Request>();
    const auditLogService = this.resolveAuditLogService();

    if (!auditLogService) {
      return;
    }

    this.resolveAuditContextService()?.setFromRequest(request);

    await auditLogService.sendAuditLog(this.createFailedLoginAuditLog(request));
  }

  private createFailedLoginAuditLog(request: Request): IAuditLog {
    const identifier = this.resolveIdentifier(request) ?? UNKNOWN_VALUE;

    return {
      resource: {
        id: identifier,
        type: 'Auth',
        label: identifier,
      } as IAuditLog['resource'] & { label: string },
      operation: {
        id: 'auth.login',
        type: 'Login',
        status: 'FAILED',
      },
      actor: {
        id: identifier,
        type: 'user',
        label: identifier,
        ip: resolveRequestIp(request),
        agent: resolveUserAgent(request),
      } as IAuditLog['actor'] & { label: string },
    };
  }

  private resolveIdentifier(request: Request): string | undefined {
    const identifier = (request.body as Record<string, unknown> | undefined)
      ?.identifier;

    if (typeof identifier !== 'string') {
      return undefined;
    }

    const trimmed = identifier.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  private resolveAuditLogService(): SdkAuditLogService | undefined {
    try {
      return this.moduleRef.get(SdkAuditLogService, { strict: false });
    } catch {
      return undefined;
    }
  }

  private resolveAuditContextService(): AuditContextService | undefined {
    try {
      return this.moduleRef.get(AuditContextService, { strict: false });
    } catch {
      return undefined;
    }
  }
}
