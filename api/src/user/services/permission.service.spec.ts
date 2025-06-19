/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

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

import { PermissionService } from './permission.service';

describe('PermissionService', () => {
  let permissionService: PermissionService;
  let modelRepository: ModelRepository;
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let permission: Permission;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['InvitationModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
      providers: [PermissionService, RoleRepository, ModelRepository],
    });
    [permissionService, roleRepository, modelRepository, permissionRepository] =
      await getMocks([
        PermissionService,
        RoleRepository,
        ModelRepository,
        PermissionRepository,
      ]);
    permission = (await permissionRepository.findOne({
      action: Action.CREATE,
    })) as Permission;
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find a permission and populate its role and model', async () => {
      jest.spyOn(permissionRepository, 'findOneAndPopulate');
      const role = await roleRepository.findOne(permission.role);
      const model = await modelRepository.findOne(permission.model);
      const result = await permissionService.findOneAndPopulate(permission.id);
      expect(permissionRepository.findOneAndPopulate).toHaveBeenLastCalledWith(
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
      jest.spyOn(permissionRepository, 'findAllAndPopulate');
      const allModels = await modelRepository.findAll();
      const allRoles = await roleRepository.findAll();
      const allPermissions = await permissionRepository.findAll();
      const result = await permissionService.findAllAndPopulate();
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
      expect(permissionRepository.findAllAndPopulate).toHaveBeenCalled();
      expect(result).toEqualPayload(permissionsWithRolesAndModels);
    });
  });

  describe('getPermissions', () => {
    it('should get a permission tree', async () => {
      const currentModels = await permissionService.findAllAndPopulate();
      const permissionTree = permissionService.buildTree(currentModels);
      const result = await permissionService.getPermissions();
      expect(result).toEqual(permissionTree);
    });
  });

  describe('buildTree', () => {
    it('should return an empty object when permissions are empty', () => {
      expect(permissionService.buildTree([])).toEqual({});
    });

    it('should correctly organize permissions into a tree structure', () => {
      const permissions = [
        {
          role: { id: 'admin' },
          model: { identity: 'user' },
          action: Action.CREATE,
        },
        {
          role: { id: 'admin' },
          model: { identity: 'user' },
          action: Action.DELETE,
        },
        {
          role: { id: 'user' },
          model: { identity: 'profile' },
          action: Action.READ,
        },
      ] as PermissionFull[];
      expect(permissionService.buildTree(permissions)).toEqual({
        admin: {
          user: ['create', 'delete'],
        },
        user: {
          profile: ['read'],
        },
      });
    });

    it('should handle roles with multiple models and actions', () => {
      const permissions = [
        {
          role: { id: 'admin' },
          model: { identity: 'user' },
          action: Action.CREATE,
        },
        {
          role: { id: 'admin' },
          model: { identity: 'settings' },
          action: Action.UPDATE,
        },
        {
          role: { id: 'admin' },
          model: { identity: 'user' },
          action: Action.UPDATE,
        },
      ] as PermissionFull[];
      expect(permissionService.buildTree(permissions)).toEqual({
        admin: {
          user: ['create', 'update'],
          settings: ['update'],
        },
      });
    });
  });
});
