/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';

import { PERMISSION_CACHE_KEY } from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  PermissionDtoConfig,
  PermissionFull,
  PermissionTransformerDto,
} from '../dto/permission.dto';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { PermissionRepository } from '../repositories/permission.repository';
import { PermissionsTree } from '../types/permission.type';

@Injectable()
export class PermissionService extends BaseOrmService<
  PermissionOrmEntity,
  PermissionTransformerDto,
  PermissionDtoConfig
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
    const currentPermissions = await this.findAllAndPopulate();
    return this.buildTree(currentPermissions);
  }

  /**
   * Builds a tree structure of permissions based on roles and models.
   *
   * @param permissions - Array of permission entities.
   *
   * @returns A tree structure mapping roles and models to actions.
   */
  buildTree(permissions: PermissionFull[]): PermissionsTree {
    return permissions.reduce<PermissionsTree>((acc, p) => {
      const role = p.role?.id;
      const model = p.model?.identity ?? p.model?.id;

      if (!role || !model) {
        return acc;
      }

      acc[role] = acc[role] || {};
      acc[role][model] = acc[role][model] || [];

      acc[role][model].push(p.action);
      return acc;
    }, {});
  }
}
