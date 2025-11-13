/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

// eslint-disable-next-line import/order
import { ISendMailOptions } from '@nestjs-modules/mailer';
import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { SentMessageInfo } from 'nodemailer';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { MailerService } from '@hexabot/mailer';
import { getRandom } from '@/utils/helpers/safeRandom';
import { installLanguageFixturesTypeOrm } from '@/utils/test/fixtures/language';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { roleFixtureIds } from '@/utils/test/fixtures/role';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { Role } from '../dto/role.dto';
import { UserCreateDto } from '../dto/user.dto';
import { InvitationOrmEntity } from '../entities/invitation.entity';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { InvitationRepository } from '../repositories/invitation.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
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
    const mailerMock = {
      sendMail(_options: ISendMailOptions): Promise<SentMessageInfo> {
        return Promise.resolve('Mail sent successfully');
      },
    };
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [LocalAuthController],
      imports: [JwtModule.register({})],
      providers: [
        RoleService,
        InvitationService,
        UserService,
        RoleRepository,
        InvitationRepository,
        UserRepository,
        LanguageService,
        LanguageRepository,
        {
          provide: MailerService,
          useValue: mailerMock,
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
      typeorm: {
        entities: [
          InvitationOrmEntity,
          RoleOrmEntity,
          UserOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          AttachmentOrmEntity,
          LanguageOrmEntity,
        ],
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

  describe('signup', () => {
    it('should throw a BadRequestException', async () => {
      jest
        .spyOn(userService, 'create')
        .mockRejectedValueOnce(new Error('invalid role'));
      const userCreateDto: UserCreateDto = {
        username: 'test',
        first_name: 'test',
        last_name: 'test',
        email: 'test@test.test',
        password: 'test',
        roles: ['invalid role value'],
        avatar: null,
      };

      await expect(authController.signup(userCreateDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(userService.create).toHaveBeenCalledWith(userCreateDto);
    });

    it('should call userService.create with the correct parameters and return status ok', async () => {
      jest.spyOn(userService, 'create');
      const userCreateDto: UserCreateDto = {
        username: 'test',
        first_name: 'test',
        last_name: 'test',
        email: 'test@test.test',
        password: 'test',
        roles: [roleFixtureIds.admin],
        avatar: null,
      };
      const result = await authController.signup(userCreateDto);
      expect(userService.create).toHaveBeenCalledWith(userCreateDto);
      expect(result).toEqual({ success: true });
    });
  });

  describe('acceptInvite', () => {
    it('should throw a BadRequestException because token is invalid', async () => {
      jest.spyOn(authController, 'signup');
      const promise = authController.acceptInvite(baseUser, 'invalid token');
      expect(promise).rejects.toThrow(BadRequestException);
      expect(authController.signup).not.toHaveBeenCalled();
    });

    it('should throw an UnauthorizedException because token is expired', async () => {
      const token = await jwtService.sign(baseUser, {
        ...invitationService.jwtSignOptions,
        expiresIn: '0s',
      });
      jest.spyOn(authController, 'signup');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(UnauthorizedException);
      expect(authController.signup).not.toHaveBeenCalled();
    });

    it('should throw a BadRequestException because email does not match', async () => {
      const token = await jwtService.sign(
        { ...baseUser, email: 'test2@wrongMail.Com' },
        invitationService.jwtSignOptions,
      );
      jest.spyOn(authController, 'signup');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(BadRequestException);
      expect(authController.signup).not.toHaveBeenCalled();
    });

    it('should throw a BadRequestException because role does not match', async () => {
      const token = await jwtService.sign(
        { ...baseUser, role: 'invalid role' },
        invitationService.jwtSignOptions,
      );
      jest.spyOn(authController, 'signup');
      const promise = authController.acceptInvite(baseUser, token);
      expect(promise).rejects.toThrow(InternalServerErrorException);
      expect(authController.signup).not.toHaveBeenCalled();
    });
  });
});
