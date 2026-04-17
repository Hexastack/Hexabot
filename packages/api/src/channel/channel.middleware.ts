/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

import { ChannelService } from './channel.service';

@Injectable()
export class ChannelMiddleware implements NestMiddleware {
  constructor(private readonly channelService: ChannelService) {}

  private resolveChannelName(req: Request): string | undefined {
    const paths = [req.path, req.originalUrl, req.url];

    for (const path of paths) {
      if (!path) {
        continue;
      }

      const [pathname] = path.split('?');
      const match = pathname.match(/(?:^|\/)webhook\/([^/]+)/);

      if (match?.[1]) {
        return match[1];
      }
    }

    return undefined;
  }

  async use(req: Request, res: Response, next: NextFunction) {
    // Iterate through channel handlers to execute a certain middleware if needed
    try {
      const channelName = this.resolveChannelName(req);

      if (channelName) {
        const channel = this.channelService.getChannelHandler(channelName);
        if (channel) {
          return await channel.middleware(req, res, next);
        }
      }
      next();
    } catch (_err) {
      next(new Error(`Unable to execute middleware on route ${req.path}`));
    }
  }
}
