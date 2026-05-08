/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';

import { getJestBaseUrl, getJestHost, getJestPort } from '@/utils/test/port';
import { buildTestingMocks } from '@/utils/test/utils';

import { SocketEventDispatcherService } from './services/socket-event-dispatcher.service';
import { WebsocketGateway } from './websocket.gateway';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let app: INestApplication;
  let createSocket: (id: string, query?: any) => Socket;
  let sockets: Socket[];

  beforeAll(async () => {
    const { module } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [WebsocketGateway, SocketEventDispatcherService],
    });
    app = module.createNestApplication();
    gateway = app.get<WebsocketGateway>(WebsocketGateway);

    createSocket = (id: string, query: any = {}) => {
      const socket = io(getJestBaseUrl(), {
        autoConnect: false,
        transports: ['websocket'],
        query: { EIO: '4', transport: 'websocket', ...query },
        extraHeaders: {
          'x-client-id': id,
        },
      });

      return socket;
    };
    sockets = [
      createSocket('admin-1'), // Admin user 1
      createSocket('admin-2'), // Admin user 2
      createSocket('admin-3'), // Admin user 3
      createSocket('subscriber', { channel: 'web' }), // Subscriber
    ];

    await app.listen(getJestPort(), getJestHost());
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(jest.clearAllMocks);

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should connect successfully', async () => {
    const [socket1] = sockets;
    const connectionPromise = new Promise<void>((resolve) => {
      socket1.on('connect', async () => {
        expect(true).toBe(true);
        resolve();
      });
    });

    socket1.connect();

    await connectionPromise;

    socket1.disconnect();
  });

  it('should emit "OK" on "healthcheck"', async () => {
    const [socket1] = sockets;
    const connectionPromise = new Promise<void>((resolve) => {
      socket1.on('connect', () => {
        socket1.emit('healthcheck', 'Hello world!');
        socket1.on('event', (data) => {
          expect(data).toBe('OK');
          resolve();
        });
      });
    });

    socket1.connect();

    await connectionPromise;

    socket1.disconnect();
  });
});
