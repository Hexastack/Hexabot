/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import type { User } from '@hexabot-ai/types';
import { JwtModule } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

import { LanguageService } from '@/i18n/services/language.service';
import { LoggerService } from '@/logger/logger.service';
import { MailerService } from '@/mailer/mailer.service';
import { I18nServiceProvider } from '@/utils/test/providers/i18n-service.provider';
import { MailerServiceProvider } from '@/utils/test/providers/mailer-service.provider';

import { UserService } from './user.service';
import { ValidateAccountService } from './validate-account.service';

describe('ValidateAccountService', () => {
  let module: TestingModule;
  let validateAccountService: ValidateAccountService;
  let mailerService: MailerService;
  let logger: LoggerService;
  const adminUser = {
    email: 'admin@admin.admin',
    firstName: 'admin',
  } satisfies Pick<User, 'email' | 'firstName'>;
  const languageServiceMock = {
    getDefaultLanguage: jest.fn().mockResolvedValue({ code: 'en' }),
  };
  const userServiceMock = {
    updateOne: jest.fn(),
  };
  const loggerMock = {
    warn: jest.fn(),
  };

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [JwtModule.register({})],
      providers: [
        ValidateAccountService,
        MailerServiceProvider,
        I18nServiceProvider,
        {
          provide: LanguageService,
          useValue: languageServiceMock,
        },
        {
          provide: UserService,
          useValue: userServiceMock,
        },
        {
          provide: LoggerService,
          useValue: loggerMock,
        },
      ],
    }).compile();

    validateAccountService = module.get(ValidateAccountService);
    mailerService = module.get(MailerService);
    logger = module.get(LoggerService);
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('sendConfirmationEmail', () => {
    it('should send an email with a token', async () => {
      const sendMailSpy = jest.spyOn(mailerService, 'sendMail');
      const signSpy = jest.spyOn(validateAccountService, 'sign');
      const promise = validateAccountService.sendConfirmationEmail({
        email: adminUser.email,
        firstName: adminUser.firstName,
      });
      await expect(promise).resolves.toBeUndefined();

      expect(sendMailSpy).toHaveBeenCalled();
      expect(signSpy).toHaveBeenCalled();
    });

    it('should warn and resolve when sending email fails', async () => {
      jest
        .spyOn(mailerService, 'sendMail')
        .mockRejectedValueOnce(new Error('Email Service is not enabled'));
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(
        validateAccountService.sendConfirmationEmail({
          email: adminUser.email,
          firstName: adminUser.firstName,
        }),
      ).resolves.toBeUndefined();
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
