/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express'; // Import the Express request and response types

import { LoggerService } from '@/logger/logger.service';
import { Roles } from '@/utils/decorators/roles.decorator';

import { ChannelService } from './channel.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Handles GET requests to download a file
   *
   * @param channel - The name of the channel for which the request is being sent.
   * @param filename - The name of the requested file
   * @param t - The JWT Token query param.
   * @param req - The HTTP express request object.
   *
   * @returns A promise that resolves a streamable file.
   */
  @Roles('public')
  @Get(':channel/download/:name')
  async handleDownload(
    @Param('channel') channel: string,
    @Param('name') name: string,
    @Query('t') token: string,
    @Req() req: Request,
  ) {
    this.logger.log('Channel download request: ', channel, name);
    return await this.channelService.download(channel, token, req);
  }

  /**
   * Handles GET requests of a specific channel.
   * This endpoint is accessible to public access (messaging platforms).
   * It logs the request method and the channel name, then delegates the request
   * to the `channelService` for further handling.
   *
   * @param channel - The name of the channel for which the request is being sent.
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   *
   * @returns A promise that resolves with the result of the `channelService.handle` method.
   */
  @Roles('public')
  @Get(':channel')
  async handleGet(
    @Param('channel') channel: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    this.logger.log('Channel notification : ', req.method, channel);
    return await this.channelService.handle(channel, req, res);
  }

  /**
   * Handles POST requests for a specific channel.
   * This endpoint is accessible to public access (messaging platforms).
   * It logs the request method and the channel name, then delegates the request
   * to the `channelService` for further handling.
   *
   * @param channel - The name of the channel for which the notification is being sent.
   * @param req - The HTTP request object.
   * @param res - The HTTP response object.
   *
   * @returns A promise that resolves with the result of the `channelService.handle` method.
   */
  @Roles('public')
  @Post(':channel')
  async handlePost(
    @Param('channel') channel: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    this.logger.log('Channel notification : ', req.method, channel);
    return await this.channelService.handle(channel, req, res);
  }

  @Roles('public')
  @Get(':channel/not-found')
  async handleNotFound(@Res() res: Response) {
    return res.status(404).send({ error: 'Resource not found!' });
  }
}
