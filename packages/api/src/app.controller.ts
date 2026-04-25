/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { AppService } from './app.service';
import { config } from './config';
import { csrf } from './config/csrf';
import { Roles } from './utils/decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Roles('public')
  @Get('health')
  healthCheck() {
    return 'OK';
  }

  @Get('stats/integration-health')
  async integrationHealth() {
    return await this.appService.getIntegrationHealth();
  }

  @Roles('public')
  @Get('config')
  getConfig(@Req() req: Request) {
    return {
      apiUrl: config.apiBaseUrl,
      ssoEnabled: config.ssoEnabled,
      maxUploadSize: config.parameters.maxUploadSize,
      hasUserSession: !!req.session.passport?.user,
    };
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
