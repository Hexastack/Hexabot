/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MailerService } from '@/mailer';

export const mailerMock = {
  sendMail: jest.fn((_options) =>
    Promise.resolve('Mail sent successfully'),
  ) satisfies MailerService['sendMail'],
};

export const MailerServiceProvider = {
  provide: MailerService,
  useValue: mailerMock,
};
