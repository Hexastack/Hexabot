/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { PermissionDto } from '../dto/permission.dto';
import {
  Permission,
  PERMISSION_POPULATE,
  PermissionFull,
  PermissionPopulate,
} from '../schemas/permission.schema';

@Injectable()
export class PermissionRepository extends BaseRepository<
  Permission,
  PermissionPopulate,
  PermissionFull,
  PermissionDto
> {
  constructor(@InjectModel(Permission.name) readonly model: Model<Permission>) {
    super(model, Permission, PERMISSION_POPULATE, PermissionFull);
  }
}
