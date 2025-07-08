/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { PermissionService } from '@/user/services/permission.service';
import { UserService } from '@/user/services/user.service';
import { MethodToAction } from '@/user/types/action.type';
import { TModel } from '@/user/types/model.type';

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly logger: LoggerService,
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * Checks if a request (REST/WebSocket) is authorized to get access
   *
   * @param method - The Request Method
   * @param userRoles - An array of ID's user Roles or empty
   * @param targetModel - The target model that we want access
   * @returns
   */
  async canAccess(
    method: string,
    userId: string,
    targetModel?: TModel,
  ): Promise<boolean> {
    try {
      if (!targetModel) {
        return false;
      }
      const user = await this.userService.findOne(userId);
      const permissions = await this.permissionService.getPermissions();

      if (permissions && user?.roles?.length) {
        const permissionsFromRoles = Object.entries(permissions)
          .filter(([key, _]) => user.roles.includes(key))
          .map(([_, value]) => value);

        if (
          permissionsFromRoles.some((permission) =>
            permission[targetModel]?.includes(MethodToAction[method]),
          )
        ) {
          return true;
        }
      }
    } catch (err) {
      this.logger.error('Request has no ability to get access', err);
      return false;
    }

    return false;
  }
}
