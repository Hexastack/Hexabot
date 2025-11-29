/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { UnauthorizedException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';

import { getRandom } from '@/utils/helpers/safeRandom';
import { installLanguageFixturesTypeOrm } from '@/utils/test/fixtures/language';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { roleFixtureIds } from '@/utils/test/fixtures/role';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { MailerServiceProvider } from '@/utils/test/providers/mailer-service.provider';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { Role } from '../dto/role.dto';
import { UserCreateDto } from '../dto/user.dto';
import { InvitationService } from '../services/invitation.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

import { LocalAuthController } from './auth.controller';

describe('AuthController (TypeORM)', () => {
  let module: TestingModule;
  let authController: LocalAuthController;
  let userService: UserService;
  let invitationService: InvitationService;
  let roleService: RoleService;
  let jwtService: JwtService;
  let role: Role;
  let baseUser: UserCreateDto;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [LocalAuthController],
      imports: [JwtModule.register({})],
      providers: [RoleService, MailerServiceProvider, I18nServiceProvider],
      typeorm: {
        fixtures: [
          installLanguageFixturesTypeOrm,
          installPermissionFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;

    [authController, userService, invitationService, roleService, jwtService] =
      await testing.getMocks([
        LocalAuthController,
        UserService,
        InvitationService,
        RoleService,
        JwtService,
      ]);

    const foundRole = await roleService.findOne(roleFixtureIds.admin);
    if (!foundRole) {
      throw new Error('Expected admin role fixture to be available');
    }
    role = foundRole;
    baseUser = {
      email: 'test@testing.com',
      password: getRandom().toString(),
      username: 'test',
      first_name: 'test',
      last_name: 'test',
      roles: [role.id],
      avatar: null,
    };
    const invitationPayload: InvitationCreateDto = {
      email: baseUser.email,
      roles: baseUser.roles,
    };
    await invitationService.create(invitationPayload);
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('acceptInvite', () => {
    it('should throw a BadRequestException because token is invalid', async () => {
      jest.spyOn(userService, 'create');
      const promise = authController.acceptInvite(baseUser, 'invalid token');
      expect(promise).rejects.toThrow(BadRequestException);
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should throw an UnauthorizedException because token is expired', async () => {
      const token = await jwtService.sign(baseUser, {
        ...invitationService.jwtSignOptions,
        expiresIn: '0s',
      });
      jest.spyOn(userService, 'create');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(
        new UnauthorizedException('Token expired'),
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should throw a BadRequestException because email does not match', async () => {
      const token = await jwtService.sign(
        { ...baseUser, email: 'test2@wrongMail.Com' },
        invitationService.jwtSignOptions,
      );
      jest.spyOn(userService, 'create');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(
        new BadRequestException(`Email doesn't match invitation email`),
      );
      expect(userService.create).not.toHaveBeenCalled();
    });

    it('should throw a BadRequestException because role does not match', async () => {
      const token = await jwtService.sign(
        { ...baseUser, roles: ['invalid role'] },
        invitationService.jwtSignOptions,
      );
      jest.spyOn(userService, 'create');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(
        new BadRequestException('invitation roles do not match user roles'),
      );
      expect(userService.create).not.toHaveBeenCalled();
    });
  });
});
