/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NotFoundException } from '@nestjs/common';

import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { PermissionCreateDto } from '../dto/permission.dto';
import { Model } from '../schemas/model.schema';
import { Permission, PermissionFull } from '../schemas/permission.schema';
import { Role } from '../schemas/role.schema';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { Action } from '../types/action.type';

import { PermissionController } from './permission.controller';

describe('PermissionController', () => {
  let permissionController: PermissionController;
  let permissionService: PermissionService;
  let roleService: RoleService;
  let modelService: ModelService;
  let deletedId: string;
  let adminRole: Role;
  let contentModel: Model;
  let createPermission: Permission;
  let allPermissions: Permission[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['InvitationModel'],
      autoInjectFrom: ['controllers'],
      controllers: [PermissionController],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
    });
    [permissionController, roleService, modelService, permissionService] =
      await getMocks([
        PermissionController,
        RoleService,
        ModelService,
        PermissionService,
      ]);
    allPermissions = await permissionService.findAll();
    adminRole = (await roleService.findOne({ name: 'admin' })) as Role;
    contentModel = (await modelService.findOne({ name: 'Content' })) as Model;
    createPermission = (await permissionService.findOne({
      action: Action.CREATE,
    })) as Permission;
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('find', () => {
    it('should find permission', async () => {
      jest.spyOn(permissionService, 'find');
      const result = await permissionController.find([], {});
      expect(permissionService.find).toHaveBeenCalled();
      expect(result).toEqualPayload(allPermissions);
    });

    it('should find permissions, and for each permission populate the corresponding model and role', async () => {
      jest.spyOn(permissionService, 'findAndPopulate');
      const allRoles = await roleService.findAll();
      const allModels = await modelService.findAll();
      const result = await permissionController.find(['model', 'role'], {});
      expect(permissionService.findAndPopulate).toHaveBeenCalled();
      const permissionsWithRolesAndModels = allPermissions.reduce(
        (acc, currPermission) => {
          acc.push({
            ...currPermission,
            role: allRoles.find((role) => {
              return role.id === currPermission.role;
            }) as Role,

            model: allModels.find((model) => {
              return model.id === currPermission.model;
            }) as Model,
          });

          return acc;
        },
        [] as PermissionFull[],
      );

      expect(result).toEqualPayload(permissionsWithRolesAndModels);
    });
  });

  describe('deleteOne', () => {
    it('should delete a permission with the id', async () => {
      jest.spyOn(permissionService, 'deleteOne');

      const result = await permissionController.deleteOne(createPermission.id);
      deletedId = createPermission.id;
      expect(permissionService.deleteOne).toHaveBeenCalledWith(
        createPermission.id,
      );
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });

    it('should throw a NotFoundException when attempting to delete a non existing permission', async () => {
      jest.spyOn(permissionService, 'deleteOne');
      await expect(permissionController.deleteOne(deletedId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should return created permission', async () => {
      jest.spyOn(permissionService, 'create');
      const permissionDto: PermissionCreateDto = {
        model: contentModel.id,
        role: adminRole.id,
        action: Action.CREATE,
        relation: 'role',
      };
      const result = await permissionController.create(permissionDto);
      expect(permissionService.create).toHaveBeenCalledWith(permissionDto);
      expect(result).toEqualPayload(permissionDto);
    });
  });
});
