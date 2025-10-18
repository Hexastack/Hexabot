/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import {
  installPermissionFixturesTypeOrm,
  permissionOrmFixtures,
} from '@/utils/test/fixtures/permission';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Permission } from '../dto/permission.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { Action } from '../types/action.type';

import { PermissionService } from './permission.service';

describe('PermissionService (TypeORM)', () => {
  let module: TestingModule;
  let permissionService: PermissionService;
  let modelRepository: ModelRepository;
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let permission: Permission;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        PermissionService,
        RoleRepository,
        ModelRepository,
        PermissionRepository,
      ],
      typeorm: {
        entities: [
          PermissionOrmEntity,
          RoleOrmEntity,
          ModelOrmEntity,
          UserOrmEntity,
          AttachmentOrmEntity,
        ],
        fixtures: installPermissionFixturesTypeOrm,
      },
    });

    module = testing.module;

    [permissionService, roleRepository, modelRepository, permissionRepository] =
      await testing.getMocks([
        PermissionService,
        RoleRepository,
        ModelRepository,
        PermissionRepository,
      ]);

    const foundPermission = await permissionRepository.findOne({
      action: Action.CREATE,
    });
    if (!foundPermission) {
      throw new Error('Expected permission fixture to be available');
    }
    permission = foundPermission;
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findOneAndPopulate', () => {
    it('should find a permission and populate its role and model', async () => {
      jest.spyOn(permissionRepository, 'findOneAndPopulate');

      const role = await roleRepository.findOne(permission.role);
      const model = await modelRepository.findOne(permission.model);
      const result = await permissionService.findOneAndPopulate(permission.id);

      expect(permissionRepository.findOneAndPopulate).toHaveBeenLastCalledWith(
        permission.id,
      );

      const expected = permissionOrmFixtures.find(
        ({ action }) => action === Action.CREATE,
      )!;
      expect(result).toEqualPayload(
        {
          id: expected.id,
          action: expected.action,
          relation: expected.relation,
        },
        ['model', 'role', 'createdAt', 'updatedAt', 'modelId', 'roleId'],
      );

      expect(result?.role?.id).toBe(role?.id);
      expect(result?.model?.id).toBe(model?.id);
    });
  });

  describe('findAndPopulate', () => {
    it('should find permissions, and for each permission, populate the corresponding role and model', async () => {
      jest.spyOn(permissionRepository, 'findAllAndPopulate');
      const allPermissions = await permissionRepository.findAll();

      const result = await permissionService.findAllAndPopulate();

      expect(permissionRepository.findAllAndPopulate).toHaveBeenCalled();
      expect(result).toHaveLength(allPermissions.length);

      result.forEach((permissionResult) => {
        expect(permissionResult.role).toBeDefined();
        expect(permissionResult.model).toBeDefined();
        const expected = permissionOrmFixtures.find(
          ({ id }) => id === permissionResult.id,
        );
        expect(expected).toBeDefined();
        expect(permissionResult.role!.id).toBe(expected?.role);
        expect(permissionResult.model!.id).toBe(expected?.model);
      });
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
      ] as any;
      expect(permissionService.buildTree(permissions as any)).toEqual({
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
      ] as any;
      expect(permissionService.buildTree(permissions as any)).toEqual({
        admin: {
          user: ['create', 'update'],
          settings: ['update'],
        },
      });
    });
  });
});
