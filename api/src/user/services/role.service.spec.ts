/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { roleFixtures } from './../../utils/test/fixtures/role';
import { RoleService } from './role.service';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { PermissionModel, Permission } from '../schemas/permission.schema';
import { RoleModel, Role } from '../schemas/role.schema';
import { UserModel, User } from '../schemas/user.schema';

describe('RoleService', () => {
  let roleService: RoleService;
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let userRepository: UserRepository;
  let role: Role;
  let users: User[];
  let permissions: Permission[];

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installPermissionFixtures),
        MongooseModule.forFeature([UserModel, PermissionModel, RoleModel]),
      ],
      providers: [
        UserRepository,
        RoleService,
        RoleRepository,
        PermissionRepository,
        EventEmitter2,
      ],
    }).compile();
    roleService = module.get<RoleService>(RoleService);
    roleRepository = module.get<RoleRepository>(RoleRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    permissionRepository =
      module.get<PermissionRepository>(PermissionRepository);
    role = await roleRepository.findOne({ name: 'admin' });
    users = (await userRepository.findAll()).filter((user) =>
      user.roles.includes(role.id),
    );

    permissions = await permissionRepository.find({ role: role.id });
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find one role and populate its permissions and users', async () => {
      jest.spyOn(roleRepository, 'findOneAndPopulate');
      const result = await roleService.findOneAndPopulate(role.id);
      expect(roleRepository.findOneAndPopulate).toHaveBeenCalledWith(role.id);
      expect(result).toEqualPayload({
        ...roleFixtures.find(({ name }) => name == 'admin'),
        users,
        permissions,
      });
    });
  });

  describe('findPageAndPopulate', () => {
    it('should find roles, and for each role populate the corresponding permissions and users', async () => {
      const pageQuery = getPageQuery<Role>({ sort: ['_id', 'asc'] });
      jest.spyOn(roleRepository, 'findPageAndPopulate');
      const allRoles = await roleRepository.findAll();
      const allPermissions = await permissionRepository.findAll();
      const allUsers = await userRepository.findAll();
      const result = await roleService.findPageAndPopulate({}, pageQuery);
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

      expect(roleRepository.findPageAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
      );
      expect(result).toEqualPayload(rolesWithPermissionsAndUsers);
    });
  });
});
