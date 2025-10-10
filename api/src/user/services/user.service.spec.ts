/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import { userFixtures } from '@/utils/test/fixtures/user';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { Role } from '../schemas/role.schema';
import { User, UserFull } from '../schemas/user.schema';

import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;
  let roleRepository: RoleRepository;
  let userRepository: UserRepository;
  let user: User | null;
  let allRoles: Role[];
  const FIELDS_TO_IGNORE: string[] = [
    ...IGNORED_TEST_FIELDS,
    'password',
    'language',
    'resetCount',
    'sendEmail',
    'state',
    'timezone',
    'resetToken',
    'provider',
  ];

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['PermissionModel', 'InvitationModel', 'AttachmentModel'],
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installPermissionFixtures)],
      providers: [UserService, RoleRepository],
    });
    [userService, roleRepository, userRepository] = await getMocks([
      UserService,
      RoleRepository,
      UserRepository,
    ]);
    user = await userRepository.findOne({ username: 'admin' });
    allRoles = await roleRepository.findAll();
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find one user and populate its role', async () => {
      jest.spyOn(userRepository, 'findOneAndPopulate');
      const result = await userService.findOneAndPopulate(user!.id);
      expect(userRepository.findOneAndPopulate).toHaveBeenCalledWith(
        user!.id,
        undefined,
      );
      expect(result).toEqualPayload(
        {
          ...userFixtures.find(({ username }) => username === 'admin'),
          roles: allRoles.filter(({ id }) => user!.roles.includes(id)),
        },
        FIELDS_TO_IGNORE,
      );
    });
  });

  describe('findAndPopulate', () => {
    it('should find users, and for each user populate the corresponding roles', async () => {
      const pageQuery = getPageQuery<User>({ sort: ['_id', 'asc'] });
      jest.spyOn(userRepository, 'findAndPopulate');
      const allUsers = await userRepository.findAll();
      const result = await userService.findAndPopulate({}, pageQuery);
      const usersWithRoles = allUsers.reduce(
        (acc, { avatar: _avatar, roles: _roles, ...rest }) => {
          acc.push({
            ...rest,
            roles: allRoles.filter(({ id }) => user?.roles?.includes(id)),
            avatar: null,
          });
          return acc;
        },
        [] as UserFull[],
      );

      expect(userRepository.findAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
        undefined,
      );
      expect(result).toEqualPayload(usersWithRoles);
    });
  });
});
