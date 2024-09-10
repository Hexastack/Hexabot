/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';
import { TFilterQuery } from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import { PERMISSION_CACHE_KEY } from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseService } from '@/utils/generics/base-service';

import { PermissionRepository } from '../repositories/permission.repository';
import { Permission, PermissionFull } from '../schemas/permission.schema';
import { PermissionsTree } from '../types/permission.type';

@Injectable()
export class PermissionService extends BaseService<Permission> {
  constructor(
    readonly repository: PermissionRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly logger: LoggerService,
  ) {
    super(repository);
  }

  /**
   * Retrieves all permissions and populates related fields such as roles and models.
   *
   * @returns A promise that resolves with the populated permissions.
   */
  async findAllAndPopulate() {
    return await this.repository.findAllAndPopulate();
  }

  /**
   * Retrieves permissions based on the provided filter and populates related fields.
   *
   * @param filter - Filter criteria to apply when searching for permissions.
   *
   * @returns A promise that resolves with the filtered and populated permissions.
   */
  async findAndPopulate(filter: TFilterQuery<Permission>) {
    return await this.repository.findAndPopulate(filter);
  }

  /**
   * Retrieves a single permission by its identifier and populates related fields.
   *
   * @param id - Identifier of the permission to retrieve.
   *
   * @returns A promise that resolves with the populated permission.
   */
  async findOneAndPopulate(id: string) {
    return await this.repository.findOneAndPopulate(id);
  }

  /**
   * Handles permission update events by clearing the permissions cache.
   *
   * This method listens to events matching the pattern 'hook:access:*:*' and clears
   * the permissions cache to ensure fresh data is used for subsequent requests.
   */
  @OnEvent('hook:access:*:*')
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
