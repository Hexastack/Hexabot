/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { LoggerService } from '@/logger/logger.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { installPermissionFixtures } from '@/utils/test/fixtures/permission';
import { userFixtures } from '@/utils/test/fixtures/user';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { PermissionService } from './permission.service';
import { RoleService } from './role.service';
import { UserService } from './user.service';
import { PermissionRepository } from '../repositories/permission.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { PermissionModel } from '../schemas/permission.schema';
import { RoleModel, Role } from '../schemas/role.schema';
import { UserModel, User } from '../schemas/user.schema';

describe('UserService', () => {
  let userService: UserService;
  let roleRepository: RoleRepository;
  let userRepository: UserRepository;
  let user: User;
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
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installPermissionFixtures),
        MongooseModule.forFeature([
          UserModel,
          PermissionModel,
          RoleModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        LoggerService,
        UserService,
        AttachmentService,
        AttachmentRepository,
        UserRepository,
        PermissionService,
        RoleService,
        RoleRepository,
        PermissionRepository,
        EventEmitter2,
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
    userService = module.get<UserService>(UserService);
    roleRepository = module.get<RoleRepository>(RoleRepository);
    userRepository = module.get<UserRepository>(UserRepository);
    user = await userRepository.findOne({ username: 'admin' });
    allRoles = await roleRepository.findAll();
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find one user and populate its role', async () => {
      jest.spyOn(userRepository, 'findOneAndPopulate');
      const result = await userService.findOneAndPopulate(user.id, ['roles']);
      expect(userRepository.findOneAndPopulate).toHaveBeenCalledWith(user.id, [
        'roles',
      ]);
      expect(result).toEqualPayload(
        {
          ...userFixtures.find(({ username }) => username === 'admin'),
          roles: allRoles.filter(({ id }) => user.roles.includes(id)),
        },
        FIELDS_TO_IGNORE,
      );
    });
  });

  describe('findPageAndPopulate', () => {
    it('should find users, and for each user populate the corresponding roles', async () => {
      const pageQuery = getPageQuery<User>({ sort: ['_id', 'asc'] });
      jest.spyOn(userRepository, 'findPageAndPopulate');
      const allUsers = await userRepository.findAll();
      const result = await userService.findPageAndPopulate({}, pageQuery, [
        'roles',
      ]);
      const usersWithRoles = allUsers.reduce((acc, currUser) => {
        acc.push({
          ...currUser,
          roles: allRoles.filter(({ id }) => user.roles.includes(id)),
        });
        return acc;
      }, []);

      expect(userRepository.findPageAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
        ['roles'],
      );
      expect(result).toEqualPayload(usersWithRoles);
    });
  });
});
