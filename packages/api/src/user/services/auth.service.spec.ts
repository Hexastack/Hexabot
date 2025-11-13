/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { installPermissionFixturesTypeOrm } from '@hexabot/dev/fixtures/permission';
import { closeTypeOrmConnections } from '@hexabot/dev/test';
import { buildTestingMocks } from '@hexabot/dev/utils';

import { User } from '../dto/user.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';

import { AuthService } from './auth.service';
import { UserService } from './user.service';

describe('AuthService (TypeORM)', () => {
  let module: TestingModule;
  let authService: AuthService;
  let userRepository: UserRepository;
  let adminUser: User | null;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [AuthService, UserService, UserRepository, RoleRepository],
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

    [authService, userRepository] = await testing.getMocks([
      AuthService,
      UserRepository,
    ]);

    adminUser = await userRepository.findOne({ where: { username: 'admin' } });
    jest.spyOn(userRepository, 'findOneByEmailWithPassword');
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('validateUser', () => {
    const adminEmail = 'admin@admin.admin';

    it('should successfully validate user with the correct password', async () => {
      const result = await authService.validateUser(adminEmail, 'adminadmin');
      expect(userRepository.findOneByEmailWithPassword).toHaveBeenCalledWith(
        adminEmail,
      );
      expect(result!.id).toBe(adminUser!.id);
    });

    it('should not validate user if the provided password is incorrect', async () => {
      const result = await authService.validateUser(
        adminEmail,
        'randomPassword',
      );
      expect(userRepository.findOneByEmailWithPassword).toHaveBeenCalledWith(
        adminEmail,
      );
      expect(result).toBeNull();
    });

    it("should not validate user's password if the user does not exist", async () => {
      const missingEmail = 'admin2@admin.admin';
      const result = await authService.validateUser(missingEmail, 'admin');
      expect(userRepository.findOneByEmailWithPassword).toHaveBeenCalledWith(
        missingEmail,
      );
      expect(result).toBeNull();
    });
  });
});
