/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ISendMailOptions } from '@nestjs-modules/mailer';
import { SentMessageInfo } from 'nodemailer';

import { I18nService } from '@/i18n/services/i18n.service';
import { MailerService } from '@/mailer/mailer.service';
import {
  installLanguageFixtures,
  installLanguageFixturesTypeOrm,
} from '@/utils/test/fixtures/language';
import { installUserFixtures, users } from '@/utils/test/fixtures/user';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ValidateAccountService } from './validate-account.service';

describe('ValidateAccountService', () => {
  let validateAccountService: ValidateAccountService;
  let mailerService: MailerService;
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
        ValidateAccountService,

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
      typeorm: {
        fixtures: installLanguageFixturesTypeOrm,
      },
    });
    [validateAccountService, mailerService] = await getMocks([
      ValidateAccountService,
      MailerService,
    ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('sendConfirmationEmail', () => {
    it('should send an email with a token', async () => {
      const sendMailSpy = jest.spyOn(mailerService, 'sendMail');
      const signSpy = jest.spyOn(validateAccountService, 'sign');
      const promise = validateAccountService.sendConfirmationEmail({
        email: users[0].email,
        first_name: users[0].first_name,
      });
      await expect(promise).resolves.toBeUndefined();

      expect(sendMailSpy).toHaveBeenCalled();
      expect(signSpy).toHaveBeenCalled();
    });
  });
});
