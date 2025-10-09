/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AppService } from './app.service';
import { csrf } from './config/csrf';
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
  csrf(@Req() req: Request, @Res() res: Response) {
    res.json({
      _csrf: csrf.generateToken(req, true),
    });
  }

  @Roles('public')
  @Get('__getcookie')
  cookies(@Req() req: Request): string {
    req.session.anonymous = true;
    return '';
  }
}
