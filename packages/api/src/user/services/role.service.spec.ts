/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

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
import { Permission } from '../schemas/permission.schema';
import { Role, RoleFull } from '../schemas/role.schema';
import { User } from '../schemas/user.schema';

import { roleFixtures } from './../../utils/test/fixtures/role';
import { RoleService } from './role.service';

describe('RoleService', () => {
  let roleService: RoleService;
  let roleRepository: RoleRepository;
  let permissionRepository: PermissionRepository;
  let userRepository: UserRepository;
  let role: Role;
  let users: User[];
  let permissions: Permission[];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['PermissionModel', 'InvitationModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
      providers: [RoleService, UserRepository, PermissionRepository],
    });
    [roleService, roleRepository, userRepository, permissionRepository] =
      await getMocks([
        RoleService,
        RoleRepository,
        UserRepository,
        PermissionRepository,
      ]);
    role = (await roleRepository.findOne({ name: 'admin' })) as Role;
    users = (await userRepository.findAll()).filter((user) =>
      user.roles.includes(role.id),
    );

    permissions = await permissionRepository.find({ role: role.id });
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find one role and populate its permissions and users', async () => {
      jest.spyOn(roleRepository, 'findOneAndPopulate');
      const result = await roleService.findOneAndPopulate(role.id, undefined);
      expect(roleRepository.findOneAndPopulate).toHaveBeenCalledWith(
        role.id,
        undefined,
      );
      expect(result).toEqualPayload({
        ...roleFixtures.find(({ name }) => name == 'admin'),
        users,
        permissions,
      });
    });
  });

  describe('findAndPopulate', () => {
    it('should find roles, and for each role populate the corresponding permissions and users', async () => {
      const pageQuery = getPageQuery<Role>({ sort: ['_id', 'asc'] });
      jest.spyOn(roleRepository, 'findAndPopulate');
      const allRoles = await roleRepository.findAll();
      const allPermissions = await permissionRepository.findAll();
      const allUsers = await userRepository.findAll();
      const result = await roleService.findAndPopulate({}, pageQuery);
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

      expect(roleRepository.findAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
        undefined,
      );
      expect(result).toEqualPayload(rolesWithPermissionsAndUsers);
    });
  });
});
