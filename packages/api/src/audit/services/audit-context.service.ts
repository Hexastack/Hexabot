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
    const actorLabel = this.resolveActorLabel(user, sessionUser, actorId);

    this.setContext({
      requestId: resolveRequestId(req),
      actorId,
      actorType,
      actorLabel,
      ip: resolveRequestIp(req),
      userAgent: resolveUserAgent(req),
      method: req.method,
      path: resolveRequestPath(req),
    });
  }

  private resolveActorLabel(
    user:
      | (User & {
          id?: string;
          username?: string;
          firstName?: string;
          lastName?: string;
        })
      | undefined,
    sessionUser:
      | {
          id?: string;
          first_name?: string;
          last_name?: string;
        }
      | undefined,
    actorId?: string,
  ): string | undefined {
    const username = this.normalizeLabelPart(user?.username);
    const fullName = this.joinName(
      user?.firstName ?? sessionUser?.first_name,
      user?.lastName ?? sessionUser?.last_name,
    );

    if (fullName && username) {
      return `${fullName} (${username})`;
    }

    return username ?? fullName ?? actorId;
  }

  private joinName(
    firstName?: string | null,
    lastName?: string | null,
  ): string | undefined {
    const value = [firstName, lastName]
      .map((part) => this.normalizeLabelPart(part))
      .filter(Boolean)
      .join(' ');

    return value.length > 0 ? value : undefined;
  }

  private normalizeLabelPart(value?: string | null): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  getContext(): AuditRequestContext {
    if (!this.cls.isActive()) {
      return {};
    }

    return this.cls.get('audit') ?? {};
  }
}
