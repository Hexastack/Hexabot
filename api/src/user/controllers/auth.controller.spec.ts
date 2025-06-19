/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { JwtService } from '@nestjs/jwt';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';

import { I18nService } from '@/i18n/services/i18n.service';
import { MailerService } from '@/mailer/mailer.service';
import { getRandom } from '@/utils/helpers/safeRandom';
import { installLanguageFixtures } from '@/utils/test/fixtures/language';
import { installUserFixtures } from '@/utils/test/fixtures/user';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { UserCreateDto } from '../dto/user.dto';
import { Role } from '../schemas/role.schema';
import { InvitationService } from '../services/invitation.service';
import { RoleService } from '../services/role.service';
import { UserService } from '../services/user.service';

import { LocalAuthController } from './auth.controller';

describe('AuthController', () => {
  let authController: LocalAuthController;
  let userService: UserService;
  let invitationService: InvitationService;
  let roleService: RoleService;
  let jwtService: JwtService;
  let role: Role | null;
  let baseUser: UserCreateDto;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      models: ['PermissionModel'],
      autoInjectFrom: ['controllers', 'providers'],
      controllers: [LocalAuthController],
      imports: [
        rootMongooseTestModule(async () => {
          await installLanguageFixtures();
          await installUserFixtures();
        }),
      ],
      providers: [
        RoleService,
        {
          provide: MailerService,
          useValue: {
            sendMail(_options: ISendMailOptions): Promise<SentMessageInfo> {
              return Promise.resolve('Mail sent successfully');
            },
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [authController, userService, invitationService, roleService, jwtService] =
      await getMocks([
        LocalAuthController,
        UserService,
        InvitationService,
        RoleService,
        JwtService,
      ]);
    role = await roleService.findOne({});
    baseUser = {
      email: 'test@testing.com',
      password: getRandom().toString(),
      username: 'test',
      first_name: 'test',
      last_name: 'test',
      roles: [role!.id],
      avatar: null,
    };
    await invitationService.create(baseUser);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('signup', () => {
    it('should throw a BadRequestException', async () => {
      jest.spyOn(userService, 'create');
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
        roles: ['659564cb4aa383c0d0dbc688'],
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

    it('should throw a UnauthorizedException because token is expired', async () => {
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
