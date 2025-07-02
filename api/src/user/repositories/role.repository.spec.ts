/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { Role, RoleFull } from '../schemas/role.schema';
import { User } from '../schemas/user.schema';

import { roleFixtures } from './../../utils/test/fixtures/role';

describe('RoleRepository', () => {
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let userRepository: UserRepository;
  let roleModel: Model<Role>;
  let role: Role;
  let users: User[];
  let roleToDelete: Role;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['UserModel', 'InvitationModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
      providers: [UserRepository, RoleRepository, PermissionRepository],
    });
    [roleRepository, userRepository, permissionRepository, roleModel] =
      await getMocks([
        RoleRepository,
        UserRepository,
        PermissionRepository,
        getModelToken(Role.name),
      ]);
    role = (await roleRepository.findOne({ name: 'admin' })) as Role;
    users = (await userRepository.findAll()).filter((user) =>
      user.roles.includes(role.id),
    );
    roleToDelete = (await roleRepository.findOne({
      name: 'manager',
    })) as Role;
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find one role and populate its permissions and users', async () => {
      jest.spyOn(roleModel, 'findById');
      const permissions = await permissionRepository.find({ role: role.id });
      const result = await roleRepository.findOneAndPopulate(role.id);
      expect(roleModel.findById).toHaveBeenCalledWith(role.id, undefined);
      expect(result).toEqualPayload({
        ...roleFixtures.find(({ name }) => name === 'admin'),
        users,
        permissions,
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should find roles, and for each role populate the corresponding permissions and users', async () => {
      const pageQuery = getPageQuery<Role>({ sort: ['_id', 'asc'] });
      jest.spyOn(roleModel, 'find');
      const allRoles = await roleRepository.findAll();
      const allPermissions = await permissionRepository.findAll();
      const allUsers = await userRepository.findAll();
      const result = await roleRepository.findAndPopulate({}, pageQuery);
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

      expect(roleModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(rolesWithPermissionsAndUsers);
    });
  });

  describe('deleteOne', () => {
    it('should delete a role by id', async () => {
      jest.spyOn(roleModel, 'deleteOne');
      const result = await roleRepository.deleteOne(roleToDelete.id);

      expect(roleModel.deleteOne).toHaveBeenCalledWith({
        _id: roleToDelete.id,
      });
      expect(result).toEqual({
        acknowledged: true,
        deletedCount: 1,
      });

      const permissions = await permissionRepository.find({
        role: roleToDelete.id,
      });
      expect(permissions.length).toEqual(0);
    });

    it('should fail to delete a role that does not exist', async () => {
      expect(await roleRepository.deleteOne(roleToDelete.id)).toEqual({
        acknowledged: true,
        deletedCount: 0,
      });
    });
  });
});
