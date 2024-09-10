/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Document, Model, Query, TFilterQuery, Types } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';

import { Permission, PermissionFull } from '../schemas/permission.schema';

@Injectable()
export class PermissionRepository extends BaseRepository<
  Permission,
  'model' | 'role'
> {
  constructor(
    @InjectModel(Permission.name) readonly model: Model<Permission>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(model, Permission);
  }

  /**
   * Emits an event after a permission is created.
   *
   * @param created - The created permission document.
   */
  async postCreate(
    created: Document<unknown, unknown, Permission> &
      Permission & { _id: Types.ObjectId },
  ): Promise<void> {
    this.eventEmitter.emit('hook:access:permission:create', created);
  }

  /**
   * Emits an event after a permission is updated.
   *
   * @param _query - The query used for updating the permission.
   * @param updated - The updated permission entity.
   */
  async postUpdate(
    _query: Query<
      Document<Permission, any, any>,
      Document<Permission, any, any>,
      unknown,
      Permission,
      'findOneAndUpdate'
    >,
    updated: Permission,
  ): Promise<void> {
    this.eventEmitter.emit('hook:access:permission:update', updated);
  }

  /**
   * Emits an event after a permission is deleted.
   *
   * @param _query - The query used for deleting the permission.
   * @param result - The result of the delete operation.
   */
  async postDelete(
    _query: Query<
      DeleteResult,
      Document<Permission, any, any>,
      unknown,
      Permission,
      'deleteOne' | 'deleteMany'
    >,
    result: DeleteResult,
  ): Promise<void> {
    this.eventEmitter.emit('hook:access:permission:delete', result);
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
