/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { LoggerService } from '@/logger/logger.service';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import { roleFixtures } from '@/utils/test/fixtures/role';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { RoleController } from './role.controller';
import { RoleCreateDto, RoleUpdateDto } from '../dto/role.dto';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { PermissionModel } from '../schemas/permission.schema';
import { RoleModel, Role } from '../schemas/role.schema';
import { UserModel } from '../schemas/user.schema';
import { PermissionService } from '../services/permission.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

describe('RoleController', () => {
  let roleController: RoleController;
  let roleService: RoleService;
  let permissionService: PermissionService;
  let userService: UserService;
  let notFoundId: string;
  let roleAdmin: Role;
  let rolePublic: Role;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoleController],
      imports: [
        rootMongooseTestModule(installPermissionFixtures),
        MongooseModule.forFeature([
          RoleModel,
          PermissionModel,
          UserModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        LoggerService,
        PermissionService,
        UserService,
        UserRepository,
        RoleService,
        RoleRepository,
        PermissionRepository,
        EventEmitter2,
        AttachmentService,
        AttachmentRepository,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    }).compile();
    roleController = module.get<RoleController>(RoleController);
    roleService = module.get<RoleService>(RoleService);
    permissionService = module.get<PermissionService>(PermissionService);
    userService = module.get<UserService>(UserService);
    roleAdmin = await roleService.findOne({ name: 'admin' });
    rolePublic = await roleService.findOne({ name: 'public' });
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    const pageQuery = getPageQuery<Role>({ sort: ['_id', 'asc'] });
    it('should find roles', async () => {
      jest.spyOn(roleService, 'findPage');
      const result = await roleController.findPage(pageQuery, [], {});
      expect(roleService.findPage).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqualPayload(roleFixtures);
    });

    it('should find roles, and for each role populate the corresponding users and permissions', async () => {
      jest.spyOn(roleService, 'findPageAndPopulate');
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
      }, []);

      expect(roleService.findPageAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
      );
      expect(result).toEqualPayload(rolesWithPermissionsAndUsers);
    });
  });

  describe('findOne', () => {
    it('should find one role', async () => {
      jest.spyOn(roleService, 'findOne');
      const result = await roleController.findOne(roleAdmin.id, []);
      expect(roleService.findOne).toHaveBeenCalledWith(roleAdmin.id);
      expect(result).toEqualPayload(
        roleFixtures.find((role) => role.name === 'admin'),
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
    it('should delete role by id', async () => {
      const result = await roleController.deleteOne(roleAdmin.id);
      notFoundId = roleAdmin.id;
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });

    it('should throw a NotFoundException when attempting to delete a role by id', async () => {
      await expect(roleController.deleteOne(notFoundId)).rejects.toThrow(
        NotFoundException,
      );
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
      await expect(
        roleController.updateOne(notFoundId, roleUpdateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
