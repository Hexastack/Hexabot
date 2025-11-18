/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as fs from 'fs';
import path from 'path';

import { Logger } from '@nestjs/common';
import { ISendMailOptions, TemplateAdapter } from '@nestjs-modules/mailer';
import Handlebars from 'handlebars';

export class MjmlAdapter implements TemplateAdapter {
  compile: TemplateAdapter['compile'] = async (
    mail: { data: ISendMailOptions },
    callback,
    options,
  ) => {
    try {
      const templatePath = path.join(
        process.cwd(),
        options.template?.dir || '',
        mail.data.template || '',
      );
      const content = fs.readFileSync(templatePath, 'utf-8');
      const delegate = Handlebars.compile(content);
      const compiledHandlebars = delegate(mail.data.context);
      const mjml2html = await import('mjml');
      const { errors, html } = mjml2html.default(compiledHandlebars);

      if (errors.length) {
        throw 'Unable to compiling mjml';
      }
      mail.data.html = html;

      callback();
    } catch (err) {
      Logger.error('@nestjs-modules/mailer: Unable to compiling mjml', err);
    }
  };
}
