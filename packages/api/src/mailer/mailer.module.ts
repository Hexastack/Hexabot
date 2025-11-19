/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from 'path';

import { Global, Module } from '@nestjs/common';
import {
  ISendMailOptions,
  MAILER_OPTIONS,
  MailerOptions,
  MailerModule as NestjsMailerModule,
} from '@nestjs-modules/mailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { config } from '@/config';

import { MailerService } from './mailer.service';
import { MjmlAdapter } from './mjml-adapter.class';

const mailerOptions: MailerOptions = {
  transport: new SMTPTransport({
    ...config.emails.smtp,
    logger: true,
    debug: false,
  }),
  template: {
    adapter: new MjmlAdapter(),
    dir: path.join(process.cwd(), 'dist', 'templates'),
    options: {
      context: {
        appName: config.parameters.appName,
        appUrl: config.uiBaseUrl,
      },
    },
  },
  defaults: { from: config.emails.from },
};

@Global()
@Module({
  imports: [
    ...(config.emails.isEnabled
      ? [NestjsMailerModule.forRoot(mailerOptions)]
      : []),
  ],
  providers: [
    {
      provide: MAILER_OPTIONS,
      useValue: mailerOptions,
    },
    ...(config.emails.isEnabled
      ? [MailerService]
      : [
          {
            provide: MailerService,
            useValue: {
              sendMail(_options: ISendMailOptions) {
                throw new Error('Email Service is not enabled');
              },
            },
          },
        ]),
  ],
  exports: [MailerService],
})
export class MailerModule {}
