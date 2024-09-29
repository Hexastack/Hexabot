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
import { Document, Model, Query, TFilterQuery, Types } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { Permission } from '../schemas/permission.schema';
import {
  Role,
  ROLE_POPULATE,
  RoleFull,
  RolePopulate,
} from '../schemas/role.schema';

@Injectable()
export class RoleRepository extends BaseRepository<
  Role,
  RolePopulate,
  RoleFull
> {
  constructor(
    @InjectModel(Role.name) readonly model: Model<Role>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super(model, Role, ROLE_POPULATE, RoleFull);
  }

  /**
   * Emits a hook event after a role is successfully created.
   *
   * @param created The created Role document.
   */
  async preCreate(
    created: Document<unknown, object, Role> & Role & { _id: Types.ObjectId },
  ): Promise<void> {
    if (created) {
      this.eventEmitter.emit('hook:access:role:create', created);
    }
  }

  /**
   * Emits a hook event after a role is successfully updated.
   *
   * @param _query The query used to update the Role.
   * @param updated The updated Role entity.
   */
  async postUpdate(
    _query: Query<
      Document<Role, any, any>,
      Document<Role, any, any>,
      unknown,
      Role,
      'findOneAndUpdate'
    >,
    updated: Role,
  ): Promise<void> {
    this.eventEmitter.emit('hook:access:role:update', updated);
  }

  /**
   * Emits a hook event after a role is successfully deleted.
   *
   * @param _query The query used to delete the Role.
   * @param result The result of the deletion operation.
   */
  async postDelete(
    _query: Query<
      DeleteResult,
      Document<Role, any, any>,
      unknown,
      Role,
      'deleteOne' | 'deleteMany'
    >,
    result: DeleteResult,
  ): Promise<void> {
    this.eventEmitter.emit('hook:access:role:delete', result);
  }

  /**
   * Deletes a single Role entity by its ID, and also deletes all related Permission entities.
   *
   * @param id The ID of the Role to delete.
   *
   * @returns The result of the delete operation.
   */
  async deleteOne(id: string) {
    const result = await this.model.deleteOne({ _id: id }).exec();
    if (result.deletedCount > 0) {
      await this.permissionModel.deleteMany({ role: id });
    }
    return result;
  }

  /**
   * Finds and paginates Role entities based on filter criteria, and populates related fields.
   *
   * @param filter Filter criteria for querying Role entities.
   * @param pageQuery Pagination details.
   *
   * @returns Paginated result of Role entities populated with related permissions and users.
   */
  async findPageAndPopulate(
    filter: TFilterQuery<Role>,
    pageQuery: PageQueryDto<Role>,
  ) {
    const query = this.findPageQuery(filter, pageQuery).populate([
      'permissions',
      'users',
    ]);
    return await this.execute(query, RoleFull);
  }

  /**
   * Finds a single Role entity by its ID, and populates related fields.
   *
   * @param id The ID of the Role to find.
   *
   * @returns The found Role entity populated with related permissions and users.
   */
  async findOneAndPopulate(id: string) {
    const query = this.findOneQuery(id).populate(['permissions', 'users']);
    return await this.executeOne(query, RoleFull);
  }
}
