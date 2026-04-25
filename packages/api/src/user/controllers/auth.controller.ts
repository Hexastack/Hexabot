/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  Session,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import { Session as ExpressSession } from 'express-session';

import { AuditAuthLogin, AuditAuthLogout } from '@/audit';
import { config } from '@/config';
import { LicenseService } from '@/license/services/license.service';
import { LoggerService } from '@/logger/logger.service';
import { Roles } from '@/utils/decorators/roles.decorator';

import { LocalAuthGuard } from '../guards/local-auth.guard';

export class BaseAuthController {
  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;

  @Inject(LicenseService)
  protected readonly license: LicenseService;

  constructor(protected readonly logger: LoggerService) {}

  /**
   * Fetches details of the currently authenticated user.
   *
   * @param req - The request object which includes user details.
   *
   * @returns The user object from the request.
   */
  @Get('me')
  async me(@Req() req: Request) {
    return {
      ...req.user,
      license: await this.license.getSnapshot(),
    };
  }

  /**
   * Handles user logout by clearing the session and cookies.
   *
   * @param session - The current user's session to be destroyed.
   * @param res - The response object used to clear the session cookie.
   *
   * @returns A status object indicating successful logout.
   */
  @Post('logout')
  @AuditAuthLogout()
  logout(
    @Session() session: ExpressSession,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.eventEmitter.emit('hook:user:logout', session);
    res.clearCookie(config.session.name);

    session.destroy((error) => {
      if (error) {
        this.logger.error(error);
        throw new BadRequestException();
      }
    });

    return { status: 'ok' };
  }
}

@Controller('auth')
export class LocalAuthController extends BaseAuthController {
  constructor(logger: LoggerService) {
    super(logger);
  }

  /**
   * Handles local login process using guard for public users.
   *
   * @param req - The request object containing user details.
   *
   * @returns The logged-in user object.
   */
  @UseGuards(LocalAuthGuard)
  @Roles('public')
  @Post('local')
  @AuditAuthLogin()
  async login(@Req() req: Request) {
    return {
      ...req.user,
      license: await this.license.getSnapshot(),
    };
  }
}
