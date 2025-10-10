/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, Req } from '@nestjs/common';
import { CsrfCheck, CsrfGenAuth } from '@tekuconcept/nestjs-csrf';
import { CsrfGenerator } from '@tekuconcept/nestjs-csrf/dist/csrf.generator';
import { Request } from 'express';

import { AppService } from './app.service';
import { Roles } from './utils/decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Roles('public')
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Roles('public')
  @Get('csrftoken')
  @CsrfCheck(false)
  @CsrfGenAuth(true)
  csrf(@Req() req: Request) {
    return {
      _csrf: req.session.csrfSecret
        ? new CsrfGenerator().create(req.session.csrfSecret)
        : '',
    };
  }

  @Roles('public')
  @Get('__getcookie')
  cookies(@Req() req: Request): string {
    req.session.anonymous = true;
    return '';
  }
}
