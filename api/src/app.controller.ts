/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
