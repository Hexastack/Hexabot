/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientOptions } from 'redis';
import { ServerOptions } from 'socket.io';

import { config } from '@/config';

export class RedisIoAdapter extends IoAdapter {
  private adapter: ReturnType<typeof createAdapter>;

  async connectToRedis(): Promise<void> {
    // @todo : add zod validation
    const redisConfig: RedisClientOptions = {
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
