/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Request } from 'express';

import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import { roleFixtures } from '@/utils/test/fixtures/role';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { RoleCreateDto, RoleUpdateDto } from '../dto/role.dto';
import { Role, RoleFull } from '../schemas/role.schema';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

import { RoleController } from './role.controller';

describe('RoleController', () => {
  let roleController: RoleController;
  let roleService: RoleService;
  let permissionService: PermissionService;
  let userService: UserService;
  let roleAdmin: Role;
  let rolePublic: Role;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['InvitationModel'],
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [RoleController],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
      providers: [PermissionService],
    });
    [roleController, roleService, permissionService, userService] =
      await getMocks([
        RoleController,
        RoleService,
        PermissionService,
        UserService,
      ]);
    roleAdmin = (await roleService.findOne({ name: 'admin' })) as Role;
    rolePublic = (await roleService.findOne({ name: 'public' })) as Role;
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    const pageQuery = getPageQuery<Role>({ sort: ['_id', 'asc'] });
    it('should find roles', async () => {
      jest.spyOn(roleService, 'find');
      const result = await roleController.findPage(pageQuery, [], {});
      expect(roleService.find).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(roleFixtures);
    });

    it('should find roles, and for each role populate the corresponding users and permissions', async () => {
      jest.spyOn(roleService, 'findAndPopulate');
      const allRoles = await roleService.findAll();
      const allPermissions = await permissionService.findAll();
      const allUsers = await userService.findAll();
      const result = await roleController.findPage(
        pageQuery,
        ['users', 'permissions'],
        {},
      );

      const rolesWithPermissionsAndUsers = allRoles.reduce((acc, currRole) => {
        const roleWithPermissionsAndUsers = {
          ...currRole,
          permissions: allPermissions.filter((currPermission) => {
            return currPermission.role === currRole.id;
          }),
          users: allUsers.filter((currUser) => {
            return currUser.roles.includes(currRole.id);
          }),
        };

        acc.push(roleWithPermissionsAndUsers);
        return acc;
      }, [] as RoleFull[]);

      expect(roleService.findAndPopulate).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(rolesWithPermissionsAndUsers);
    });
  });

  describe('findOne', () => {
    it('should find one role', async () => {
      jest.spyOn(roleService, 'findOne');
      const result = (await roleController.findOne(roleAdmin.id, [])) as Role;
      expect(roleService.findOne).toHaveBeenCalledWith(roleAdmin.id);
      expect(result).toEqualPayload(
        roleFixtures.find((role) => role.name === 'admin') as Role,
      );
    });

    it('should find one role and populate its permissions and users ', async () => {
      jest.spyOn(roleService, 'findOneAndPopulate');
      const users = (await userService.findAll()).filter((user) =>
        user.roles.includes(roleAdmin.id),
      );

      const permissions = await permissionService.find({
        role: roleAdmin.id,
      });
      const result = await roleController.findOne(roleAdmin.id, [
        'users',
        'permissions',
      ]);

      expect(roleService.findOneAndPopulate).toHaveBeenCalledWith(roleAdmin.id);
      expect(result).toEqualPayload({
        ...roleFixtures.find((role) => role.name === 'admin'),
        users,
        permissions,
      });
    });
  });

  describe('count', () => {
    it('should count the roles', async () => {
      const result = await roleController.filterCount();
      expect(result).toEqual({ count: roleFixtures.length });
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
      expect(result).toEqualPayload(roleDto);
    });
  });

  describe('deleteOne', () => {
    it("should throw ForbiddenException if the role is part of the user's roles", async () => {
      const req = { user: { roles: ['role1'] } } as unknown as Request;
      const roleId = 'role1';

      userService.findOne = jest.fn().mockResolvedValue(null);

      await expect(roleController.deleteOne(roleId, req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException if the role is associated with other users', async () => {
      const req = { user: { roles: ['role2'] } } as unknown as Request;
      const roleId = 'role1';

      userService.findOne = jest.fn().mockResolvedValue({ id: 'user2' });

      await expect(roleController.deleteOne(roleId, req)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException if the role is not found', async () => {
      const req = { user: { roles: ['role2'] } } as unknown as Request;
      const roleId = 'role1';

      userService.findOne = jest.fn().mockResolvedValue(null);
      roleService.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 0 });

      await expect(roleController.deleteOne(roleId, req)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the result if the role is successfully deleted', async () => {
      const req = { user: { roles: ['role2'] } } as unknown as Request;
      const roleId = 'role1';

      userService.findOne = jest.fn().mockResolvedValue(null);
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
      expect(result).toEqualPayload({
        ...roleFixtures.find((role) => role.name === 'public'),
        ...roleUpdateDto,
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
