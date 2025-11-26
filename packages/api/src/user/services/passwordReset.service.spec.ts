/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { compareSync } from 'bcryptjs';
import { SentMessageInfo } from 'nodemailer';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { LanguageOrmEntity } from '@/i18n/entities/language.entity';
import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { I18nService } from '@/i18n/services/i18n.service';
import { LanguageService } from '@/i18n/services/language.service';
import { MailerService } from '@/mailer/mailer.service';
import { installLanguageFixturesTypeOrm } from '@/utils/test/fixtures/language';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { users } from '@/utils/test/fixtures/user';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { User } from '../dto/user.dto';
import { ModelOrmEntity } from '../entities/model.entity';
import { PermissionOrmEntity } from '../entities/permission.entity';
import { RoleOrmEntity } from '../entities/role.entity';
import { UserProfileOrmEntity } from '../entities/user-profile.entity';
import { UserOrmEntity } from '../entities/user.entity';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';

import { PasswordResetService } from './passwordReset.service';
import { UserService } from './user.service';

describe('PasswordResetService (TypeORM)', () => {
  let module: TestingModule;
  let passwordResetService: PasswordResetService;
  let mailerService: MailerService;
  let jwtService: JwtService;
  let userRepository: UserRepository;
  let userService: UserService;
  let adminUser: User | null;

  beforeAll(async () => {
    const mailerMock = {
      sendMail: jest.fn(
        (_options: ISendMailOptions): Promise<SentMessageInfo> =>
          Promise.resolve('Mail sent successfully'),
      ),
    };
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [JwtModule.register({})],
      providers: [
        PasswordResetService,
        UserService,
        UserRepository,
        RoleRepository,
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
          UserProfileOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
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

    [
      passwordResetService,
      mailerService,
      jwtService,
      userService,
      userRepository,
    ] = await testing.getMocks([
      PasswordResetService,
      MailerService,
      JwtService,
      UserService,
      UserRepository,
    ]);

    adminUser = await userService.findOne({ where: { email: users[0].email } });
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('requestReset', () => {
    it('should send an email with a token', async () => {
      const sendMailSpy = jest.spyOn(mailerService, 'sendMail');
      const signSpy = jest.spyOn(passwordResetService, 'sign');
      const promise = passwordResetService.requestReset({
        email: adminUser!.email,
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

    it('should update the password and clear the reset token', async () => {
      const spy = jest.spyOn(passwordResetService, 'sign');
      const verifySpy = jest.spyOn(passwordResetService, 'verify');
      const token = jwtService.sign(
        { email: adminUser!.email },
        passwordResetService.jwtSignOptions,
      );
      spy.mockResolvedValue(token);
      await passwordResetService.requestReset({ email: adminUser!.email });

      await expect(
        passwordResetService.reset({ password: 'newPassword' }, token),
      ).resolves.toBeUndefined();
      expect(verifySpy).toHaveBeenCalled();

      const entity = await userRepository.findOneByEmailWithPassword(
        adminUser!.email,
      );
      expect(entity?.resetToken).toBeNull();
      expect(compareSync('newPassword', entity!.password)).toBeTruthy();
    });
  });
});
