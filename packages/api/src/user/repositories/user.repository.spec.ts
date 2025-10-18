/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { roleFixtureIds } from '@/utils/test/fixtures/role';
import { userFixtures } from '@/utils/test/fixtures/user';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { User } from '../dto/user.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';

import { RoleRepository } from './role.repository';
import { UserRepository } from './user.repository';

describe('UserRepository (TypeORM)', () => {
  let module: TestingModule;
  let roleRepository: RoleRepository;
  let userRepository: UserRepository;
  let user: User | null;

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
    'avatarAttachment',
  ];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [UserRepository, RoleRepository],
      typeorm: {
        entities: [
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          AttachmentOrmEntity,
        ],
        fixtures: installPermissionFixturesTypeOrm,
      },
    });

    module = testing.module;

    [userRepository, roleRepository] = await testing.getMocks([
      UserRepository,
      RoleRepository,
    ]);

    user = await userRepository.findOne({ username: 'admin' });
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

  describe('findOneAndPopulate', () => {
    it('should find one user and populate roles', async () => {
      const result = await userRepository.findOneAndPopulate(user!.id);

      expect(result).toBeDefined();
      expect(result!.id).toBe(user!.id);
      expect(result!.username).toBe(user!.username);

      const expectedRoleIds = [
        roleFixtureIds.admin,
        roleFixtureIds.manager,
      ].sort();

      const roleIds = (result!.roles ?? []).map((role) => role.id).sort();
      expect(roleIds).toEqual(expectedRoleIds);

      const expected = userFixtures.find(
        ({ username }) => username === 'admin',
      );
      if (!expected) {
        throw new Error('Expected admin user fixture to be available');
      }
      expect(result).toEqualPayload(
        { ...expected, roles: undefined },
        [...FIELDS_TO_IGNORE, 'roles'],
      );
    });
  });

  describe('findAndPopulate', () => {
    it('should populate roles for every user', async () => {
      const users = await userRepository.findAll();
      const result = await userRepository.findAndPopulate({});

      expect(result).toHaveLength(users.length);

      result.forEach((userFull) => {
        const plain = users.find((candidate) => candidate.id === userFull.id);
        expect(plain).toBeDefined();
        expect(userFull.roles.map((role) => role.id).sort()).toEqual(
          (plain!.roles ?? []).sort(),
        );
      });
    });
  });
});
