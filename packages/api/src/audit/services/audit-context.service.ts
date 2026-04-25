/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { User } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { ClsService } from 'nestjs-cls';

import {
  AuditClsStore,
  AuditRequestContext,
} from '../types/audit-context.type';
import {
  resolveRequestId,
  resolveRequestIp,
  resolveRequestPath,
  resolveUserAgent,
} from '../utils/request-context';

@Injectable()
export class AuditContextService {
  constructor(private readonly cls: ClsService<AuditClsStore>) {}

  setContext(context: AuditRequestContext): void {
    if (!this.cls.isActive()) {
      return;
    }

    this.cls.set('audit', {
      ...(this.cls.get('audit') ?? {}),
      ...context,
    });
  }

  setFromRequest(req: Request): void {
    const user = req.user as
      | (User & { id?: string; roles?: string[] })
      | undefined;
    const sessionUser = req.session?.passport?.user;
    const actorId = user?.id ?? sessionUser?.id;
    const actorType = Array.isArray(user?.roles)
      ? user.roles.join(',')
      : user
        ? 'user'
        : undefined;

    this.setContext({
      requestId: resolveRequestId(req),
      actorId,
      actorType,
      ip: resolveRequestIp(req),
      userAgent: resolveUserAgent(req),
      method: req.method,
      path: resolveRequestPath(req),
    });
  }

  getContext(): AuditRequestContext {
    if (!this.cls.isActive()) {
      return {};
    }

    return this.cls.get('audit') ?? {};
  }
}
