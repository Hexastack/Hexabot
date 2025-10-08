/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { ChannelService } from './channel.service';

@Injectable()
export class ChannelMiddleware implements NestMiddleware {
  constructor(private readonly channelService: ChannelService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Iterate through channel handlers to execute a certain middleware if needed
    try {
      const [_, path, channelName] = req.path.split('/');
      if (path === 'webhook' && channelName) {
        const channel = this.channelService.getChannelHandler(
          `${channelName}-channel`,
        );
        if (channel) {
          return await channel.middleware(req, res, next);
        }
      }
      next();
    } catch (err) {
      next(new Error(`Unable to execute middleware on route ${req.path}`));
    }
  }
}
