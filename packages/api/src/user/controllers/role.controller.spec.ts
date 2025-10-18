/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { Request } from 'express';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { roleFixtureIds, roleOrmFixtures } from '@/utils/test/fixtures/role';
import { getPageQuery } from '@/utils/test/pagination';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Role, RoleCreateDto, RoleFull, RoleUpdateDto } from '../dto/role.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { ModelRepository } from '../repositories/model.repository';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

import { RoleController } from './role.controller';

describe('RoleController (TypeORM)', () => {
  let module: TestingModule;
  let roleController: RoleController;
  let roleService: RoleService;
  let permissionService: PermissionService;
  let userService: UserService;
  let roleAdmin: Role;
  let rolePublic: Role;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [RoleController],
      providers: [
        RoleService,
        PermissionService,
        UserService,
        RoleRepository,
        PermissionRepository,
        UserRepository,
        ModelRepository,
      ],
      typeorm: {
        entities: [
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          UserOrmEntity,
          AttachmentOrmEntity,
        ],
        fixtures: installPermissionFixturesTypeOrm,
      },
    });

    module = testing.module;

    [roleController, roleService, permissionService, userService] =
      await testing.getMocks([
        RoleController,
        RoleService,
        PermissionService,
        UserService,
      ]);

    const adminRole = await roleService.findOne({ name: 'admin' });
    const publicRole = await roleService.findOne({ name: 'public' });
    if (!adminRole || !publicRole) {
      throw new Error('Expected role fixtures to be available');
    }
    roleAdmin = adminRole;
    rolePublic = publicRole;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('findPage', () => {
    const pageQuery =
      getPageQuery<RoleOrmEntity>({ sort: ['createdAt', 'asc'] });
    it('should find roles', async () => {
      jest.spyOn(roleService, 'find');
      const result = await roleController.findPage(pageQuery, [], {});
      expect(roleService.find).toHaveBeenCalledWith({}, pageQuery);
      const expectedRoles = await roleService.findAll();
      expect(result).toEqualPayload(expectedRoles);
    });

    it('should populate users and permissions when requested', async () => {
      jest.spyOn(roleService, 'findAndPopulate');
      const allPermissions = await permissionService.findAll();
      const allUsers = await userService.findAll();
      const result = (await roleController.findPage(
        pageQuery,
        ['users', 'permissions'],
        {},
      )) as RoleFull[];

      expect(roleService.findAndPopulate).toHaveBeenCalledWith({}, pageQuery);

      result.forEach((role) => {
        const expectedPermissionIds = allPermissions
          .filter((permission) => permission.role === role.id)
          .map((permission) => permission.id)
          .sort();

        const permissionIds = (role.permissions ?? [])
          .map((permission) => permission.id)
          .sort();
        expect(permissionIds).toEqual(expectedPermissionIds);

        const expectedUserIds = allUsers
          .filter((user) => user.roles.includes(role.id))
          .map((user) => user.id)
          .sort();

        const userIds = (role.users ?? []).map((user) => user.id).sort();
        expect(userIds).toEqual(expectedUserIds);
      });
    });
  });

  describe('findOne', () => {
    it('should find one role', async () => {
      jest.spyOn(roleService, 'findOne');
      const result = await roleController.findOne(roleAdmin.id, []);
      expect(roleService.findOne).toHaveBeenCalledWith(roleAdmin.id);
      expect(result).toEqualPayload(
        {
          id: roleFixtureIds.admin,
          name: roleOrmFixtures.find(
            (fixture) => fixture.id === roleFixtureIds.admin,
          )!.name,
          active: true,
        },
        ['createdAt', 'updatedAt'],
      );
    });

    it('should populate permissions and users', async () => {
      jest.spyOn(roleService, 'findOneAndPopulate');
      const users = (await userService.findAll()).filter((user) =>
        user.roles.includes(roleAdmin.id),
      );

      const permissions = await permissionService.find({
        where: { roleId: roleAdmin.id },
      });
      const result = (await roleController.findOne(roleAdmin.id, [
        'users',
        'permissions',
      ])) as RoleFull;

      expect(roleService.findOneAndPopulate).toHaveBeenCalledWith(roleAdmin.id);

      const permissionIds = (result?.permissions ?? [])
        .map((permission) => permission.id)
        .sort();
      expect(permissionIds).toEqual(
        permissions.map((permission) => permission.id).sort(),
      );

      const userIds = (result?.users ?? []).map((user) => user.id).sort();
      expect(userIds).toEqual(users.map((user) => user.id).sort());
    });
  });

  describe('count', () => {
    it('should count the roles', async () => {
      const result = await roleController.filterCount();
      const total = await roleService.count();
      expect(result).toEqual({ count: total });
    });
  });

  describe('create', () => {
    it('should return created role', async () => {
      jest.spyOn(roleService, 'create');
      const roleDto: RoleCreateDto = {
        name: 'testRole',
        active: true,
      };
      const result = await roleController.create(roleDto);
      expect(roleService.create).toHaveBeenCalledWith(roleDto);
      expect(result).toMatchObject({
        name: roleDto.name,
        active: roleDto.active,
      });
    });
  });

  describe('deleteOne', () => {
    it("should throw ForbiddenException if the role is part of the user's roles", async () => {
      const req = { user: { roles: ['role1'] } } as unknown as Request;
      const roleId = 'role1';

      userService.findOneAndPopulate = jest.fn().mockResolvedValue(null);

      await expect(roleController.deleteOne(roleId, req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if the role is associated with other users', async () => {
      const req = { user: { roles: ['role2'] } } as unknown as Request;
      const roleId = 'role1';

      userService.findOneAndPopulate = jest
        .fn()
        .mockResolvedValue({ id: 'user2' } as any);

      await expect(roleController.deleteOne(roleId, req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if the role is not found', async () => {
      const req = { user: { roles: ['role2'] } } as unknown as Request;
      const roleId = 'role1';

      userService.findOneAndPopulate = jest.fn().mockResolvedValue(null);
      roleService.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 0 });

      await expect(roleController.deleteOne(roleId, req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the result if the role is successfully deleted', async () => {
      const req = { user: { roles: ['role2'] } } as unknown as Request;
      const roleId = 'role1';

      userService.findOneAndPopulate = jest.fn().mockResolvedValue(null);
      const deleteResult = { deletedCount: 1 };
      roleService.deleteOne = jest.fn().mockResolvedValue(deleteResult);

      const result = await roleController.deleteOne(roleId, req);
      expect(result).toEqual(deleteResult);
    });
  });

  describe('updateOne', () => {
    const roleUpdateDto: RoleUpdateDto = {
      active: false,
    };

    it('should return updated role', async () => {
      jest.spyOn(roleService, 'updateOne');
      const result = await roleController.updateOne(
        rolePublic.id,
        roleUpdateDto,
      );
      expect(roleService.updateOne).toHaveBeenCalledWith(
        rolePublic.id,
        roleUpdateDto,
      );
      expect(result).toMatchObject({
        id: rolePublic.id,
        name: roleOrmFixtures.find((role) => role.id === rolePublic.id)?.name,
        active: roleUpdateDto.active,
      });
    });

    it('should throw a NotFoundException when attempting to modify a role', async () => {
      const notFoundId = 'nonexistentRoleId';
      const roleUpdateDto = { name: 'newRoleName' };

      roleService.updateOne = jest
        .fn()
        .mockRejectedValue(new NotFoundException());

      await expect(
        roleController.updateOne(notFoundId, roleUpdateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
