/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  installPermissionFixtures,
  permissionFixtures,
} from '@/utils/test/fixtures/permission';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { Model as ModelSchema } from '../schemas/model.schema';
import { Permission, PermissionFull } from '../schemas/permission.schema';
import { Role } from '../schemas/role.schema';
import { Action } from '../types/action.type';

describe('PermissionRepository', () => {
  let modelRepository: ModelRepository;
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let permissionModel: Model<Permission>;
  let permission: Permission;
  let permissionToDelete: Permission;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['InvitationModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
      providers: [ModelRepository, RoleRepository, PermissionRepository],
    });
    [roleRepository, modelRepository, permissionRepository, permissionModel] =
      await getMocks([
        RoleRepository,
        ModelRepository,
        PermissionRepository,
        getModelToken(Permission.name),
      ]);
    permission = (await permissionRepository.findOne({
      action: Action.CREATE,
    })) as Permission;
    permissionToDelete = (await permissionRepository.findOne({
      action: Action.UPDATE,
    })) as Permission;
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find a permission and populate its role and model', async () => {
      jest.spyOn(permissionModel, 'findById');
      const role = await roleRepository.findOne(permission.role);
      const model = await modelRepository.findOne(permission.model);
      const result = await permissionRepository.findOneAndPopulate(
        permission.id,
        undefined,
      );
      expect(permissionModel.findById).toHaveBeenCalledWith(
        permission.id,
        undefined,
      );
      expect(result).toEqualPayload({
        ...permissionFixtures.find(({ action }) => action === 'create'),
        role,
        model,
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should find permissions, and for each permission, populate the corresponding role and model', async () => {
      jest.spyOn(permissionModel, 'find');
      const allModels = await modelRepository.findAll();
      const allRoles = await roleRepository.findAll();
      const allPermissions = await permissionRepository.findAll();
      const result = await permissionRepository.findAllAndPopulate();
      const permissionsWithRolesAndModels = allPermissions.reduce(
        (acc, currPermission) => {
          acc.push({
            ...currPermission,
            role: allRoles.find((role) => {
              return role.id === currPermission.role;
            }) as Role,

            model: allModels.find((model) => {
              return model.id === currPermission.model;
            }) as ModelSchema,
          });

          return acc;
        },
        [] as PermissionFull[],
      );
      expect(permissionModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(permissionsWithRolesAndModels);
    });
  });

  describe('deleteOne', () => {
    it('should delete a permission by id', async () => {
      jest.spyOn(permissionModel, 'deleteOne');
      const result = await permissionRepository.deleteOne(
        permissionToDelete.id,
      );

      expect(permissionModel.deleteOne).toHaveBeenCalledWith({
        _id: permissionToDelete.id,
        builtin: { $ne: true },
      });

      expect(result).toEqual({
        acknowledged: true,
        deletedCount: 1,
      });

      const permissions = await permissionRepository.find({
        role: permissionToDelete.id,
      });
      expect(permissions.length).toEqual(0);
    });

    it('should fail to delete a permission that does not exist', async () => {
      expect(
        await permissionRepository.deleteOne(permissionToDelete.id),
      ).toEqual({
        acknowledged: true,
        deletedCount: 0,
      });
    });
  });
});
