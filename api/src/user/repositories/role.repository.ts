/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';

import { RoleDto } from '../dto/role.dto';
import { Invitation } from '../schemas/invitation.schema';
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
  RoleFull,
  RoleDto
> {
  constructor(
    @InjectModel(Role.name) readonly model: Model<Role>,
    @InjectModel(Permission.name)
    private readonly permissionModel: Model<Permission>,
    @InjectModel(Invitation.name)
    private readonly invitationModel: Model<Invitation>,
  ) {
    super(model, Role, ROLE_POPULATE, RoleFull);
  }

  /**
   * Deletes a single Role entity by its ID, and also deletes all related Permission entities.
   *
   * @param id The ID of the Role to delete.
   *
   * @returns The result of the delete operation.
   */
  async deleteOne(id: string): Promise<DeleteResult> {
    const result = await this.model.deleteOne({ _id: id }).exec();
    if (result.deletedCount > 0) {
      await this.permissionModel.deleteMany({ role: id });
      await this.invitationModel.deleteMany({ roles: id });
    }
    return result;
  }
}
