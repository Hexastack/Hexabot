/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { INestApplication } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Socket, io } from 'socket.io-client';

import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { SocketEventDispatcherService } from './services/socket-event-dispatcher.service';
import { WebsocketGateway } from './websocket.gateway';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let app: INestApplication;
  let ioClient: Socket;

  beforeAll(async () => {
    // Instantiate the app
    const { module } = await buildTestingMocks({
      providers: [
        WebsocketGateway,
        EventEmitter2,
        SocketEventDispatcherService,
      ],
      imports: [
        rootMongooseTestModule(({ uri, dbName }) => {
          process.env.MONGO_URI = uri;
          process.env.MONGO_DB = dbName;
          return Promise.resolve();
        }),
      ],
    });
    app = module.createNestApplication();
    // Get the gateway instance from the app instance
    gateway = app.get<WebsocketGateway>(WebsocketGateway);
    // Create a new client that will interact with the gateway
    ioClient = io('http://localhost:3000', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      // path: '/socket.io/?EIO=4&transport=websocket&channel=web-channel',
      query: { EIO: '4', transport: 'websocket', channel: 'web-channel' },
    });

    app.listen(3000);
  });

  afterAll(async () => {
    await app.close();
    await closeInMongodConnection();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should connect successfully', async () => {
    ioClient.on('connect', () => {
      expect(true).toBe(true);
    });
    ioClient.connect();
    ioClient.disconnect();
  });

  it('should emit "OK" on "healthcheck"', async () => {
    ioClient.on('connect', () => {
      ioClient.emit('healthcheck', 'Hello world');

      ioClient.on('event', (data) => {
        expect(data).toBe('OK');
      });
    });
    ioClient.connect();
    ioClient.disconnect();
  });
});
