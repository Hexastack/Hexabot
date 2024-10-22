/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
