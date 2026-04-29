/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { readFile } from 'fs/promises';
import path from 'path';

import { Injectable } from '@nestjs/common';
import Handlebars from 'handlebars';
import mjml2html from 'mjml';
import nodemailer, {
  SendMailOptions as NodemailerSendMailOptions,
  SentMessageInfo,
  Transporter,
} from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { config } from '@/config';

export type SendMailOptions = NodemailerSendMailOptions & {
  template?: string;
  context?: Record<string, unknown>;
};

@Injectable()
export class MailerService {
  private readonly transporter?: Transporter<SentMessageInfo>;

  constructor() {
    if (!config.emails.isEnabled) {
      return;
    }

    this.transporter = nodemailer.createTransport(
      new SMTPTransport({
        ...config.emails.smtp,
        logger: true,
        debug: false,
      }),
    );
  }

  async sendMail({ template, context, ...options }: SendMailOptions) {
    if (!this.transporter) {
      throw new Error('Email Service is not enabled');
    }

    const html = template
      ? await this.renderTemplate(template, context)
      : options.html;

    return await this.transporter.sendMail({
      from: config.emails.from,
      ...options,
      html,
    });
  }

  async verifyAllTransporters(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    return await this.transporter.verify();
  }

  private async renderTemplate(
    template: string,
    context: Record<string, unknown> = {},
  ): Promise<string> {
    const templatePath = path.join(
      process.cwd(),
      'dist',
      'templates',
      template,
    );
    const content = await readFile(templatePath, 'utf-8');
    const compiledHandlebars = Handlebars.compile(content)({
      appName: config.parameters.appName,
      appUrl: config.uiBaseUrl,
      ...context,
    });
    const { errors, html } = mjml2html(compiledHandlebars);

    if (errors.length) {
      throw new Error('Unable to compile mjml template');
    }

    return html;
  }
}
