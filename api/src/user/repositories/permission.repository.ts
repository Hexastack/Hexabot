/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, TFilterQuery } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

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
  PermissionFull
> {
  constructor(
    readonly eventEmitter: EventEmitter2,
    @InjectModel(Permission.name) readonly model: Model<Permission>,
  ) {
    super(eventEmitter, model, Permission, PERMISSION_POPULATE, PermissionFull);
  }

  /**
   * Finds all permissions and populates the `model` and `role` relationships.
   *
   * @returns A list of populated permission entities.
   */
  async findAllAndPopulate() {
    const query = this.findAllQuery().populate(['model', 'role']);
    return await this.execute(query, PermissionFull);
  }

  /**
   * Finds permissions based on the specified filter and populates the `model` and `role` relationships.
   *
   * @param filter - The filter query for finding permissions.
   *
   * @returns A list of populated permission entities matching the filter.
   */
  async findAndPopulate(filter: TFilterQuery<Permission>) {
    const query = this.findQuery(filter).populate(['model', 'role']);
    return await this.execute(query, PermissionFull);
  }

  /**
   * Finds a single permission by its ID and populates the `model` and `role` relationships.
   *
   * @param id - The ID of the permission to find.
   *
   * @returns The populated permission entity.
   */
  async findOneAndPopulate(id: string) {
    const query = this.findOneQuery(id).populate(['model', 'role']);
    return await this.executeOne(query, PermissionFull);
  }
}
