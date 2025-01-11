/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';

import { PERMISSION_CACHE_KEY } from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseService } from '@/utils/generics/base-service';

import { PermissionDto } from '../dto/permission.dto';
import { PermissionRepository } from '../repositories/permission.repository';
import {
  Permission,
  PermissionFull,
  PermissionPopulate,
} from '../schemas/permission.schema';
import { PermissionsTree } from '../types/permission.type';

@Injectable()
export class PermissionService extends BaseService<
  Permission,
  PermissionPopulate,
  PermissionFull,
  PermissionDto
> {
  constructor(
    readonly repository: PermissionRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(repository);
  }

  /**
   * Handles permission update events by clearing the permissions cache.
   *
   * This method listens to events matching the pattern 'hook:access:*:*' and clears
   * the permissions cache to ensure fresh data is used for subsequent requests.
   */
  @OnEvent('hook:role:*')
  @OnEvent('hook:permission:*')
  async handlePermissionUpdateEvent() {
    await this.cacheManager.del(PERMISSION_CACHE_KEY);
  }

  /**
   * Retrieves the permissions tree from the cache or generates it if not present.
   *
   * @returns A promise that resolves with the permissions tree.
   */
  @Cacheable(PERMISSION_CACHE_KEY)
  async getPermissions(): Promise<PermissionsTree> {
    const currentModels = await this.findAllAndPopulate();
    return this.buildTree(currentModels);
  }

  /**
   * Builds a tree structure of permissions based on roles and models.
   *
   * @param permissions - Array of full permission objects.
   *
   * @returns A tree structure mapping roles and models to actions.
   */
  buildTree(permissions: PermissionFull[]): PermissionsTree {
    return permissions.reduce((acc, p) => {
      const role = p.role.id;
      const model = p.model.identity;

      acc[role] = acc[role] || {};
      acc[role][model] = acc[role][model] || [];

      acc[role][model].push(p.action);
      return acc;
    }, {});
  }
}
