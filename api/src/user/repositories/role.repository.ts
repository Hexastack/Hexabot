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
    readonly eventEmitter: EventEmitter2,
  ) {
    super(model, Role, ROLE_POPULATE, RoleFull);
    super.setEventEmitter(eventEmitter);
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
