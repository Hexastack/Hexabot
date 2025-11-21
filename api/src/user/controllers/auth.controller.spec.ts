/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

// eslint-disable-next-line import/order
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { UnauthorizedException } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions/bad-request.exception';
import { JwtService } from '@nestjs/jwt';
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
