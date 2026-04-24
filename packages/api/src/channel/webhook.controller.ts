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
  @Get(':sourceId/download/:name')
  async handleDownload(
    @UuidParam('sourceId') sourceId: string,
    @Param('name') name: string,
    @Query('t') token: string,
    @Req() req: Request,
  ) {
    this.logger.log('Channel download request: ', sourceId, name);

    return await this.channelDownloadService.download(sourceId, token, req);
  }

  @Roles('public')
  @Get(':sourceId')
  async handleGet(
    @UuidParam('sourceId') sourceId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.handleSourceRequest(sourceId, req, res);
  }

  @Roles('public')
  @Get(':sourceId/not-found')
  async handleNotFound(
    @UuidParam('sourceId') _sourceId: string,
    @Res() res: Response,
  ) {
    return res.status(404).send({ error: 'Resource not found!' });
  }

  @Roles('public')
  @Get(':sourceId/:workflowId')
  async handleGetWithWorkflow(
    @UuidParam('sourceId') sourceId: string,
    @UuidParam('workflowId') workflowId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.handleSourceRequest(sourceId, req, res, workflowId);
  }

  @Roles('public')
  @Post(':sourceId')
  async handlePost(
    @UuidParam('sourceId') sourceId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.handleSourceRequest(sourceId, req, res);
  }

  @Roles('public')
  @Post(':sourceId/:workflowId')
  async handlePostWithWorkflow(
    @UuidParam('sourceId') sourceId: string,
    @UuidParam('workflowId') workflowId: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    return await this.handleSourceRequest(sourceId, req, res, workflowId);
  }

  private async handleSourceRequest(
    sourceId: string,
    req: Request,
    res: Response,
    workflowId?: string,
  ): Promise<void> {
    this.logger.log(
      'Channel notification : ',
      req.method,
      sourceId,
      workflowId,
    );

    return await this.channelService.handle(sourceId, req, res, workflowId);
  }
}
