/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Controller, Get, Param, Post, Query, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

import { LoggerService } from '@/logger/logger.service';
import { UuidParam } from '@/utils';
import { Roles } from '@/utils/decorators/roles.decorator';

import { ChannelService } from './channel.service';
import { ChannelDownloadService } from './services/channel-download.service';

@Controller('webhook')
export class WebhookController {
  constructor(
    private readonly channelService: ChannelService,
    private readonly channelDownloadService: ChannelDownloadService,
    private readonly logger: LoggerService,
  ) {}

  @Roles('public')
  @Get(':sourceRef/download/:name')
  async handleDownload(
    @Param('sourceRef') sourceRef: string,
    @Param('name') name: string,
    @Query('t') token: string,
    @Req() req: Request,
  ) {
    this.logger.log('Channel download request: ', sourceRef, name);

    return await this.channelDownloadService.download(sourceRef, token, req);
  }

  @Roles('public')
  @Get(':sourceRef')
  async handleGet(
    @Param('sourceRef') sourceRef: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.handleSourceRequest(sourceRef, req, res);
  }

  @Roles('public')
  @Get(':sourceRef/not-found')
  async handleNotFound(
    @Param('sourceRef') _sourceRef: string,
    @Res() res: Response,
  ) {
    return res.status(404).send({ error: 'Resource not found!' });
  }

  @Roles('public')
  @Get(':sourceRef/:workflowId')
  async handleGetWithWorkflow(
    @Param('sourceRef') sourceRef: string,
    @UuidParam('workflowId') workflowId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.handleSourceRequest(sourceRef, req, res, workflowId);
  }

  @Roles('public')
  @Post(':sourceRef')
  async handlePost(
    @Param('sourceRef') sourceRef: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.handleSourceRequest(sourceRef, req, res);
  }

  @Roles('public')
  @Post(':sourceRef/:workflowId')
  async handlePostWithWorkflow(
    @Param('sourceRef') sourceRef: string,
    @UuidParam('workflowId') workflowId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.handleSourceRequest(sourceRef, req, res, workflowId);
  }

  private async handleSourceRequest(
    sourceRef: string,
    req: Request,
    res: Response,
    workflowId?: string,
  ): Promise<void> {
    this.logger.log(
      'Channel notification : ',
      req.method,
      sourceRef,
      workflowId,
    );

    return await this.channelService.handle(sourceRef, req, res, workflowId);
  }
}
