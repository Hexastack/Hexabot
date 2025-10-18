/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import {
  Permission,
  PermissionCreateDto,
  PermissionFull,
} from '../dto/permission.dto';
import { Role } from '../dto/role.dto';
import { ModelOrmEntity as ModelEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { ModelService } from '../services/model.service';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { Action } from '../types/action.type';

import { PermissionController } from './permission.controller';

describe('PermissionController (TypeORM)', () => {
  let module: TestingModule;
  let permissionController: PermissionController;
  let permissionService: PermissionService;
  let roleService: RoleService;
  let modelService: ModelService;
  let deletedId: string;
  let adminRole: Role;
  let contentModel: ModelEntity;
  let createPermission: Permission;
  let allPermissions: Permission[];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [PermissionController],
      providers: [
        PermissionService,
        RoleService,
        ModelService,
        PermissionRepository,
        RoleRepository,
        ModelRepository,
      ],
      typeorm: {
        entities: [
          PermissionOrmEntity,
          RoleOrmEntity,
          ModelEntity,
          UserOrmEntity,
          AttachmentOrmEntity,
        ],
        fixtures: installPermissionFixturesTypeOrm,
      },
    });

    module = testing.module;

    [permissionController, roleService, modelService, permissionService] =
      await testing.getMocks([
        PermissionController,
        RoleService,
        ModelService,
        PermissionService,
      ]);

    allPermissions = await permissionService.findAll();
    const role = await roleService.findOne({ name: 'admin' });
    if (!role) {
      throw new Error('Expected admin role fixture to be available');
    }
    adminRole = role;
    contentModel = (await modelService.findOne({
      name: 'Content',
    })) as ModelEntity;
    const permission = await permissionService.findOne({
      action: Action.CREATE,
    });
    if (!permission) {
      throw new Error('Expected permission fixture to be available');
    }
    createPermission = permission;
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('find', () => {
    it('should find permissions', async () => {
      jest.spyOn(permissionService, 'find');
      const result = await permissionController.find([], {});
      expect(permissionService.find).toHaveBeenCalled();
      expect(result.length).toBe(allPermissions.length);
    });

    it('should populate model and role when requested', async () => {
      jest.spyOn(permissionService, 'findAndPopulate');
      const result = (await permissionController.find(
        ['model', 'role'],
        {},
      )) as PermissionFull[];
      expect(permissionService.findAndPopulate).toHaveBeenCalled();

      result.forEach((permission) => {
        const expected = allPermissions.find(
          (item) => item.id === permission.id,
        );
        expect(expected).toBeDefined();
        expect(permission.role?.id).toBe(expected?.role);
        expect(permission.model?.id).toBe(expected?.model);
      });
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
      expect(result).toMatchObject({
        action: permissionDto.action,
        relation: permissionDto.relation,
        role: permissionDto.role,
        model: permissionDto.model,
      });
    });
  });
});
