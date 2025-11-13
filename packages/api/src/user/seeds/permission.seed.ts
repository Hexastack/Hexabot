/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmSeeder } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';

import {
  PermissionDtoConfig,
  PermissionTransformerDto,
} from '../dto/permission.dto';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { PermissionRepository } from '../repositories/permission.repository';

@Injectable()
export class PermissionSeeder extends BaseOrmSeeder<
  PermissionOrmEntity,
  PermissionTransformerDto,
  PermissionDtoConfig
> {
  constructor(private readonly permissionRepository: PermissionRepository) {
    super(permissionRepository);
  }
}
