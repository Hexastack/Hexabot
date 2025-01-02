/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { InternalServerErrorException } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';

import { config } from '@/config';

export class RedisIoAdapter extends IoAdapter {
  private adapter: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    if (config.cache.host !== 'redis') {
      throw new InternalServerErrorException(
        `Unable to run connect to redis host is ${config.cache.host} instead of 'redis'`,
      );
    }
    // @todo : add zod validation
    const redisConfig = {
      socket: {
        host: config.cache.host,
        port: config.cache.port,
      },
    };
    const pubClient = createClient(redisConfig);
    const subClient = pubClient.duplicate();
    pubClient.on('error', (error) => {
      throw error;
    });
    subClient.on('error', (error) => {
      throw error;
    });
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapter = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapter);
    return server;
  }
}
