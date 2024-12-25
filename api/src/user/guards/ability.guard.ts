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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request } from 'express';

import { TRole } from '../schemas/role.schema';
import { User } from '../schemas/user.schema';
import { PermissionService } from '../services/permission.service';
import { MethodToAction } from '../types/action.type';
import { TModel } from '../types/model.type';

import { AttachmentGuard } from './rules/attachment-guard-rules';

@Injectable()
export class Ability implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
    private readonly attachmentGuard: AttachmentGuard,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<TRole[]>('roles', context.getHandler());

    if (roles?.includes('public')) {
      return true;
    }

    const { user, method, _parsedUrl, session } = context
      .switchToHttp()
      .getRequest<Request & { user: User; _parsedUrl: Url }>();

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!session?.cookie || session.cookie.expires < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    const [_, controller, action] = _parsedUrl.pathname.split('/');
    const modelName = controller.toLowerCase() as TModel;

    const isAttachmentUrl =
      modelName === 'attachment' && ['upload', 'download'].includes(action);
    if (isAttachmentUrl) {
      return await this.attachmentGuard.canActivate(context);
    }

    if (user?.roles?.length) {
      if (
        ['/auth/logout', '/logout', '/auth/me', '/channel', '/i18n'].includes(
          _parsedUrl.pathname,
        )
      ) {
        return true;
      }

      const permissions = await this.permissionService.getPermissions();

      if (permissions) {
        const permissionsFromRoles = Object.entries(permissions)
          .filter(([key, _]) => user.roles.includes(key))
          .map(([_, value]) => value);

        if (
          permissionsFromRoles.some((permission) =>
            permission[modelName]?.includes(MethodToAction[method]),
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
