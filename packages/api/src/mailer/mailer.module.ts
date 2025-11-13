/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from 'path';

import { config } from '@hexabot/config';
import { Global, Module } from '@nestjs/common';
import {
  ISendMailOptions,
  MAILER_OPTIONS,
  MailerModule as NestjsMailerModule,
} from '@nestjs-modules/mailer';
import { MjmlAdapter } from '@nestjs-modules/mailer/dist/adapters/mjml.adapter';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { MailerService } from './mailer.service';

const mailerOptions = {
  transport: new SMTPTransport({
    ...config.emails.smtp,
    logger: true,
    debug: false,
  }),
  template: {
    adapter: new MjmlAdapter(
      'handlebars',
      {
        inlineCssEnabled: false,
      },
      {
        handlebar: {},
      },
    ),
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
