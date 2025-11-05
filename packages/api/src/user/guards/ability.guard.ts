/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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

import { config } from '@/config';

import { User } from '../dto/user.dto';
import { TRole } from '../entities/role.entity';
import { PermissionService } from '../services/permission.service';
import { MethodToAction } from '../types/action.type';
import { TModel } from '../types/model.type';

@Injectable()
export class Ability implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly permissionService: PermissionService,
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
    if (
      !session.cookie ||
      (session.cookie?.expires && session.cookie?.expires < new Date())
    ) {
      throw new UnauthorizedException('Session expired');
    }

    const roleIds = Array.isArray(user.roles) ? user.roles : [];

    if (roleIds.length) {
      const pathname =
        config.mode === 'monolith'
          ? _parsedUrl.pathname?.replace(`/${config.apiPrefix}`, '')
          : _parsedUrl.pathname;

      if (
        pathname &&
        [
          // Allow access to all routes available for authenticated users
          '/auth/logout',
          '/logout',
          '/auth/me',
          '/channel',
          '/i18n',
          // Allow to update own profile
          `/user/edit/${user.id}`,
          // Allow access to own avatar
          `/user/${user.id}/profile_pic`,
        ].includes(pathname)
      ) {
        return true;
      }
      const modelFromPathname = pathname?.split('/')[1].toLowerCase() as
        | TModel
        | undefined;
      const permissions = await this.permissionService.getPermissions();

      if (permissions) {
        const permissionsFromRoles = Object.entries(permissions)
          .filter(([key, _]) => roleIds.includes(key))
          .map(([_, value]) => value);

        if (
          modelFromPathname &&
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
