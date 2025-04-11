/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import { userFixtures } from '@/utils/test/fixtures/user';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { InvitationModel } from '../schemas/invitation.schema';
import { PermissionModel } from '../schemas/permission.schema';
import { Role, RoleModel } from '../schemas/role.schema';
import { User, UserFull, UserModel } from '../schemas/user.schema';

import { InvitationRepository } from './invitation.repository';

describe('UserRepository', () => {
  let roleRepository: RoleRepository;
  let userRepository: UserRepository;
  let userModel: Model<User>;
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
      imports: [
        rootMongooseTestModule(installPermissionFixtures),
        MongooseModule.forFeature([
          UserModel,
          PermissionModel,
          RoleModel,
          InvitationModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        UserRepository,
        RoleRepository,
        InvitationRepository,
        PermissionRepository,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
      ],
    });
    [roleRepository, userRepository, userModel] = await getMocks([
      RoleRepository,
      UserRepository,
      getModelToken(User.name),
    ]);
    user = await userRepository.findOne({ username: 'admin' });
    allRoles = await roleRepository.findAll();
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find one user and populate its role', async () => {
      jest.spyOn(userModel, 'findById');
      const result = await userRepository.findOneAndPopulate(user!.id);
      expect(userModel.findById).toHaveBeenCalledWith(user!.id, undefined);
      expect(result).toEqualPayload(
        {
          ...userFixtures.find(({ username }) => username === 'admin'),
          roles: allRoles.filter(({ id }) => user!.roles.includes(id)),
        },
        FIELDS_TO_IGNORE,
      );
    });
  });

  describe('findPageAndPopulate', () => {
    it('should find users, and for each user populate the corresponding roles', async () => {
      jest.spyOn(userModel, 'find');
      const pageQuery = getPageQuery<User>({ sort: ['_id', 'asc'] });
      jest.spyOn(userRepository, 'findPageAndPopulate');
      const allUsers = await userRepository.findAll();
      const allRoles = await roleRepository.findAll();
      const result = await userRepository.findPageAndPopulate({}, pageQuery);
      const usersWithRoles = allUsers.reduce((acc, currUser) => {
        acc.push({
          ...currUser,
          roles: allRoles.filter(({ id }) => user?.roles.includes(id)),
          avatar: null,
        });
        return acc;
      }, [] as UserFull[]);

      expect(userModel.find).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqualPayload(usersWithRoles);
    });
  });
});
