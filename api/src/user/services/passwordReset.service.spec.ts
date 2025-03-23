/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { compareSync } from 'bcryptjs';
import { Model } from 'mongoose';
import { SentMessageInfo } from 'nodemailer';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageModel } from '@/i18n/schemas/language.schema';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { installLanguageFixtures } from '@/utils/test/fixtures/language';
import { installUserFixtures, users } from '@/utils/test/fixtures/user';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { InvitationRepository } from '../repositories/invitation.repository';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';
import { InvitationModel } from '../schemas/invitation.schema';
import { PermissionModel } from '../schemas/permission.schema';
import { RoleModel } from '../schemas/role.schema';
import { User, UserModel } from '../schemas/user.schema';

import { PasswordResetService } from './passwordReset.service';
import { RoleService } from './role.service';
import { UserService } from './user.service';

describe('PasswordResetService', () => {
  let passwordResetService: PasswordResetService;
  let mailerService: MailerService;
  let jwtService: JwtService;
  let userModel: Model<User>;
  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      imports: [
        rootMongooseTestModule(async () => {
          await installLanguageFixtures();
          await installUserFixtures();
        }),
        MongooseModule.forFeature([
          UserModel,
          RoleModel,
          PermissionModel,
          AttachmentModel,
          LanguageModel,
          InvitationModel,
        ]),
        JwtModule,
      ],
      providers: [
        UserService,
        UserRepository,
        RoleService,
        AttachmentService,
        AttachmentRepository,
        RoleRepository,
        InvitationRepository,
        LanguageService,
        LanguageRepository,
        PasswordResetService,
        {
          provide: MailerService,
          useValue: {
            sendMail: jest.fn(
              (_options: ISendMailOptions): Promise<SentMessageInfo> =>
                Promise.resolve('Mail sent successfully'),
            ),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
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
    [passwordResetService, mailerService, jwtService, userModel] =
      await getMocks([
        PasswordResetService,
        MailerService,
        JwtService,
        getModelToken(User.name),
      ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('requestReset', () => {
    it('should send an email with a token', async () => {
      const sendMailSpy = jest.spyOn(mailerService, 'sendMail');
      const signSpy = jest.spyOn(passwordResetService, 'sign');
      const promise = passwordResetService.requestReset({
        email: users[0].email,
      });
      await expect(promise).resolves.toBeUndefined();

      expect(sendMailSpy).toHaveBeenCalled();
      expect(signSpy).toHaveBeenCalled();
    });

    it('should throw a 404 error', async () => {
      const promise = passwordResetService.requestReset({
        email: 'a@b.ca',
      });
      await expect(promise).rejects.toThrow(NotFoundException);
    });

    it('should return change the password', async () => {
      const spy = jest.spyOn(passwordResetService, 'sign');
      const verifySpy = jest.spyOn(passwordResetService, 'verify');
      const token = jwtService.sign(
        { email: users[0].email },
        passwordResetService.jwtSignOptions,
      );
      spy.mockResolvedValue(token);
      await passwordResetService.requestReset({ email: users[0].email });

      const promise = passwordResetService.reset(
        { password: 'newPassword' },
        token,
      );

      await expect(promise).resolves.toBeUndefined();
      expect(verifySpy).toHaveBeenCalled();

      const user = await userModel.findOne({ email: users[0].email });
      expect(user!.resetToken).toBeNull();
      expect(compareSync('newPassword', user!.password)).toBeTruthy();
    });
  });
});
