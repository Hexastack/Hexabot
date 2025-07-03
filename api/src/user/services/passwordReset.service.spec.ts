/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { compareSync } from 'bcryptjs';
import { Model } from 'mongoose';
import { SentMessageInfo } from 'nodemailer';

import { I18nService } from '@/i18n/services/i18n.service';
import { MailerService } from '@/mailer/mailer.service';
import { installLanguageFixtures } from '@/utils/test/fixtures/language';
import { installUserFixtures, users } from '@/utils/test/fixtures/user';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { User } from '../schemas/user.schema';

import { PasswordResetService } from './passwordReset.service';

describe('PasswordResetService', () => {
  let passwordResetService: PasswordResetService;
  let mailerService: MailerService;
  let jwtService: JwtService;
  let userModel: Model<User>;
  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [
        rootMongooseTestModule(async () => {
          await installLanguageFixtures();
          await installUserFixtures();
        }),
      ],
      providers: [
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
