/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  Post,
  Req,
  Res,
  Session,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Request, Response } from 'express';
import { Session as ExpressSession } from 'express-session';

import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { Roles } from '@/utils/decorators/roles.decorator';

import { InvitationCreateDto } from '../dto/invitation.dto';
import { UserCreateDto } from '../dto/user.dto';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { InvitationService } from '../services/invitation.service';
import { UserService } from '../services/user.service';
import { ValidateAccountService } from '../services/validate-account.service';

export class BaseAuthController {
  @Inject(EventEmitter2)
  private readonly eventEmitter: EventEmitter2;

  constructor(protected readonly logger: LoggerService) {}

  /**
   * Fetches details of the currently authenticated user.
   *
   * @param req - The request object which includes user details.
   *
   * @returns The user object from the request.
   */
  @Get('me')
  me(@Req() req: Request) {
    return req.user;
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
  constructor(
    logger: LoggerService,
    private readonly userService: UserService,
    private readonly validateAccountService: ValidateAccountService,
    private readonly invitationService: InvitationService,
  ) {
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
  login(@Req() req: Request) {
    return req.user;
  }

  /**
   * Handles the signup process for new users.
   *
   * @param userCreateDto - Data Transfer Object containing the new user's information.
   *
   * @returns Success status object upon successful signup.
   */
  @Roles('public')
  @Post('signup')
  async signup(@Body() userCreateDto: UserCreateDto) {
    try {
      await this.userService.create(userCreateDto);
      return { success: true };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException();
    }
  }

  /**
   * Accepts an invitation and creates a new user based on the invitation token.
   * Verifies the token and ensures it matches the user details.
   *
   * @param userCreateDto - Data Transfer Object for the new user.
   * @param token - The invitation token.
   *
   * @returns Void, upon successful creation of the user.
   */
  @Roles('public')
  @Post('accept-invite/:token')
  async acceptInvite(
    @Body() userCreateDto: UserCreateDto,
    @Param('token') token: string,
  ) {
    let decodedToken: InvitationCreateDto;

    // Verify token
    try {
      decodedToken = await this.invitationService.verify(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError')
        throw new UnauthorizedException('Token expired');
      else throw new BadRequestException(error.name, error.message);
    }

    // Verify token matches user
    if (decodedToken.email !== userCreateDto.email)
      throw new BadRequestException("Email doesn't match invitation email");
    if (decodedToken.roles.some((item) => !userCreateDto.roles.includes(item)))
      throw new BadRequestException('invitation roles do not match user roles');

    try {
      // Create user
      await this.userService.create({ ...userCreateDto, state: false });

      await this.validateAccountService.sendConfirmationEmail({
        email: userCreateDto.email,
        first_name: userCreateDto.first_name,
      });

      await this.invitationService.deleteOne({ email: decodedToken.email });
    } catch (e) {
      this.logger.error(
        'Could not send email',
        e.message,
        e.stack,
        'AcceptInvite',
      );
      throw new InternalServerErrorException('Could not send email');
    }
  }
}
