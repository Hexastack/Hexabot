/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import {
  installPermissionFixtures,
  permissionFixtures,
} from '@/utils/test/fixtures/permission';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { ModelModel } from '../schemas/model.schema';
import { Permission, PermissionModel } from '../schemas/permission.schema';
import { RoleModel } from '../schemas/role.schema';
import { Action } from '../types/action.type';

describe('PermissionRepository', () => {
  let modelRepository: ModelRepository;
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let permissionModel: Model<Permission>;
  let permission: Permission;
  let permissionToDelete: Permission;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installPermissionFixtures),
        MongooseModule.forFeature([ModelModel, PermissionModel, RoleModel]),
      ],
      providers: [
        ModelRepository,
        RoleRepository,
        PermissionRepository,
        EventEmitter2,
      ],
    }).compile();
    roleRepository = module.get<RoleRepository>(RoleRepository);
    modelRepository = module.get<ModelRepository>(ModelRepository);
    permissionRepository =
      module.get<PermissionRepository>(PermissionRepository);
    permissionModel = module.get<Model<Permission>>(
      getModelToken('Permission'),
    );
    permission = await permissionRepository.findOne({
      action: Action.CREATE,
    });
    permissionToDelete = await permissionRepository.findOne({
      action: Action.UPDATE,
    });
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

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
            }),

            model: allModels.find((model) => {
              return model.id === currPermission.model;
            }),
          });

          return acc;
        },
        [],
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
