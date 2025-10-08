/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import mongoose from 'mongoose';

import { ModelCreateDto } from '@/user/dto/model.dto';
import { PermissionCreateDto } from '@/user/dto/permission.dto';
import ModelSchema, { Model } from '@/user/schemas/model.schema';
import PermissionSchema, { Permission } from '@/user/schemas/permission.schema';
import roleSchema, { Role, RoleDocument } from '@/user/schemas/role.schema';
import userSchema, { User } from '@/user/schemas/user.schema';
import { Action } from '@/user/types/action.type';

import { MigrationServices } from '../types';

const actions: PermissionCreateDto['action'][] = Object.values(Action);

/**
 *
 * @returns The admin role or null
 */
const getAdminRole = async () => {
  const RoleModel = mongoose.model<Role>(Role.name, roleSchema);
  const adminRole = await RoleModel.findOne({ name: 'admin' });

  return adminRole;
};

/**
 * @returns The admin user or null
 */
const getAdminUser = async (role: RoleDocument) => {
  const UserModel = mongoose.model<User>(User.name, userSchema);

  const user = await UserModel.findOne({ roles: { $in: [role._id] } }).sort({
    createdAt: 'asc',
  });

  return user;
};

const migrateLabelGroupModelAndPermissions = async (
  services: MigrationServices,
) => {
  const adminRole = await getAdminRole();

  if (!adminRole) {
    throw new Error('Unable to process labelGroup: no admin role found');
  }

  const adminUser = await getAdminUser(adminRole);

  if (!adminUser) {
    throw new Error('Unable to process labelGroup: no admin user found');
  }

  const ModelModel = mongoose.model<Model>(Model.name, ModelSchema);
  const PermissionModel = mongoose.model<Permission>(
    Permission.name,
    PermissionSchema,
  );

  try {
    const hasLabelGroup = await ModelModel.findOne({
      identity: 'labelgroup',
    });

    if (!hasLabelGroup) {
      const modelPayload = {
        name: 'LabelGroup',
        identity: 'labelgroup',
        relation: 'role',
        attributes: {},
      } satisfies ModelCreateDto;

      const createdModel = await ModelModel.create(modelPayload);
      const permissionsPayload = actions.map(
        (action) =>
          ({
            role: adminRole._id.toString(),
            model: createdModel._id.toString(),
            action,
            relation: 'role',
          }) satisfies PermissionCreateDto,
      );

      await PermissionModel.insertMany(permissionsPayload);
    }
  } catch (error) {
    services.logger.error(
      `Failed to create labelGroup model: ${error.message}`,
    );

    throw error instanceof Error ? error : new Error(error);
  }
};

module.exports = {
  async up(services: MigrationServices) {
    try {
      await migrateLabelGroupModelAndPermissions(services);

      return true;
    } catch (error) {
      services.logger.error(`Migration failed : ${error.message}`);
      throw error instanceof Error ? error : new Error(error);
    }
  },
  async down(services: MigrationServices) {
    try {
      const ModelModel = mongoose.model<Model>(Model.name, ModelSchema);
      const PermissionModel = mongoose.model<Permission>(
        Permission.name,
        PermissionSchema,
      );

      const labelGroupModel = await ModelModel.findOne({
        identity: 'labelgroup',
      });

      if (labelGroupModel) {
        await PermissionModel.deleteMany({ model: labelGroupModel._id });
        await ModelModel.deleteOne({ _id: labelGroupModel._id });

        services.logger.log('Successfully rolled back labelGroup migration');
      }

      return true;
    } catch (error) {
      services.logger.error(`Migration rollback failed: ${error.message}`);
      throw error instanceof Error ? error : new Error(error);
    }
  },
};
