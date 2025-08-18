/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
}
