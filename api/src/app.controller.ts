/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  BadRequestException,
  Controller,
  Get,
  Req,
  Res,
  Session,
} from '@nestjs/common';
import { CsrfCheck, CsrfGenAuth } from '@tekuconcept/nestjs-csrf';
import { CsrfGenerator } from '@tekuconcept/nestjs-csrf/dist/csrf.generator';
import { Request, Response } from 'express';
import { Session as ExpressSession } from 'express-session';

import { AppService } from './app.service';
import { config } from './config';
import { LoggerService } from './logger/logger.service';
import { Roles } from './utils/decorators/roles.decorator';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly logger: LoggerService,
  ) {}

  @Roles('public')
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Roles('public')
  @Get('csrftoken')
  @CsrfCheck(false)
  @CsrfGenAuth(true)
  csrf(@Session() session: ExpressSession) {
    return {
      _csrf: session?.csrfSecret
        ? new CsrfGenerator().create(session.csrfSecret)
        : '',
    };
  }

  @Roles('public')
  @Get('__getcookie')
  cookies(@Req() req: Request): string {
    req.session.anonymous = true;
    return '_sailsIoJSConnect();';
  }

  // @TODO : remove once old frontend is abandoned
  @Get('logout')
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    res.clearCookie(config.session.name);

    req.session.destroy((error) => {
      if (error) {
        this.logger.error(error);
        throw new BadRequestException();
      }
    });
    return { status: 'ok' };
  }
}
