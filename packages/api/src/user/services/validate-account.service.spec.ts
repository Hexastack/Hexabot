/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JwtModule } from '@nestjs/jwt';
import { TestingModule } from '@nestjs/testing';

import { LanguageRepository } from '@/i18n/repositories/language.repository';
import { LanguageService } from '@/i18n/services/language.service';
import { MailerService } from '@/mailer/mailer.service';
import { installLanguageFixturesTypeOrm } from '@/utils/test/fixtures/language';
import { installPermissionFixturesTypeOrm } from '@/utils/test/fixtures/permission';
import { users } from '@/utils/test/fixtures/user';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { MailerServiceProvider } from '@/utils/test/providers/mailer-service.provider';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { User } from '../dto/user.dto';
import { RoleRepository } from '../repositories/role.repository';
import { UserRepository } from '../repositories/user.repository';

import { UserService } from './user.service';
import { ValidateAccountService } from './validate-account.service';

describe('ValidateAccountService (TypeORM)', () => {
  let module: TestingModule;
  let validateAccountService: ValidateAccountService;
  let mailerService: MailerService;
  let adminUser: User;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [JwtModule.register({})],
      providers: [
        ValidateAccountService,
        UserService,
        UserRepository,
        RoleRepository,
        LanguageService,
        LanguageRepository,
        MailerServiceProvider,
        I18nServiceProvider,
      ],
      typeorm: {
        fixtures: [
          installLanguageFixturesTypeOrm,
          installPermissionFixturesTypeOrm,
        ],
      },
    });

    module = testing.module;

    [validateAccountService, mailerService] = await testing.getMocks([
      ValidateAccountService,
      MailerService,
    ]);

    const userService = await testing.getMocks([UserService]);
    const foundUser = await (userService[0] as UserService).findOne({
      where: { email: users[0].email },
    });
    if (!foundUser) {
      throw new Error('Expected admin user fixture to be available');
    }
    adminUser = foundUser;
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('sendConfirmationEmail', () => {
    it('should send an email with a token', async () => {
      const sendMailSpy = jest.spyOn(mailerService, 'sendMail');
      const signSpy = jest.spyOn(validateAccountService, 'sign');
      const promise = validateAccountService.sendConfirmationEmail({
        email: adminUser.email,
        first_name: adminUser.first_name,
      });
      await expect(promise).resolves.toBeUndefined();

      expect(sendMailSpy).toHaveBeenCalled();
      expect(signSpy).toHaveBeenCalled();
    });
  });
});
