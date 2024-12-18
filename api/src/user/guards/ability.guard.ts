/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Url } from 'url';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { TContextType } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';

import { TRole } from '../schemas/role.schema';
import { User } from '../schemas/user.schema';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';
import { MethodToAction } from '../types/action.type';
import { TModel } from '../types/model.type';

import { AttachmentGuardRules } from './rules/attachment-guard-rules';

@Injectable()
export class Ability extends AttachmentGuardRules implements CanActivate {
  constructor(
    private reflector: Reflector,
    readonly permissionService: PermissionService,
    readonly modelService: ModelService,
    readonly attachmentService: AttachmentService,
  ) {
    super(permissionService, modelService, attachmentService);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<TRole[]>('roles', context.getHandler());

    if (roles?.includes('public')) {
      return true;
    }

    const { user, method, _parsedUrl, session, query } = context
      .switchToHttp()
      .getRequest<Request & { user: User; _parsedUrl: Url }>();

    const paths = _parsedUrl.pathname.split('/');
    const modelFromPathname = paths?.[1].toLowerCase() as TModel;
    const isAttachmentUrl =
      modelFromPathname === 'attachment' &&
      ['upload', 'download'].includes(paths?.[2]);

    if (!user && !isAttachmentUrl) {
      throw new UnauthorizedException();
    }
    if (!session?.cookie || session.cookie.expires < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    if (
      ['/auth/logout', '/logout', '/auth/me', '/channel', '/i18n'].includes(
        _parsedUrl.pathname,
      )
    ) {
      return true;
    }

    if (isAttachmentUrl) {
      // attachment
      const attachmentUploadContext =
        query?.context?.toString() as TContextType;
      if (
        method === 'POST' &&
        paths?.[2] === 'upload' &&
        attachmentUploadContext
      )
        return await this.hasRequiredUploadPermission(
          user,
          attachmentUploadContext,
        );
      else if (method === 'GET' && paths?.[2] === 'download')
        return await this.hasRequiredDownloadPermission(user, paths?.[3]);
      else {
        return false;
      }
    }

    if (user?.roles?.length) {
      const permissions = await this.permissionService.getPermissions();

      if (permissions) {
        const permissionsFromRoles = Object.entries(permissions)
          .filter(([key, _]) => user.roles.includes(key))
          .map(([_, value]) => value);

        if (
          permissionsFromRoles.some((permission) =>
            permission[modelFromPathname]?.includes(MethodToAction[method]),
          )
        ) {
          return true;
        }
      } else {
        throw new NotFoundException('Failed to load permissions');
      }
    }

    return false;
  }
}
