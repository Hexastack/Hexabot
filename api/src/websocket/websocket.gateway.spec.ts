/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { INestApplication } from '@nestjs/common';
import { Socket, io } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { SocketEventDispatcherService } from './services/socket-event-dispatcher.service';
import { Room } from './types';
import { WebsocketGateway } from './websocket.gateway';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let app: INestApplication;
  let createSocket: (index: number) => Socket;
  let sockets: Socket[];
  let sessionIds: string[];
  let validSessionIds: string[];

  beforeAll(async () => {
    // Instantiate the app
    const { module } = await buildTestingMocks({
      providers: [WebsocketGateway, SocketEventDispatcherService],
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

    sessionIds = [uuidv4(), uuidv4(), uuidv4()];
    validSessionIds = [sessionIds[0], sessionIds[2]];

    createSocket = (index: number) =>
      io('http://localhost:3000', {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        // path: '/socket.io/?EIO=4&transport=websocket&channel=web-channel',
        query: { EIO: '4', transport: 'websocket', channel: 'web-channel' },
        extraHeaders: { sessionid: sessionIds[index] },
      });

    sockets = sessionIds.map((e, index) => createSocket(index));

    await app.listen(3000);
  });

  afterAll(async () => {
    await app.close();
    await closeInMongodConnection();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  it('should connect successfully', async () => {
    const [socket1] = sockets;
    socket1.connect();

    await new Promise<void>((resolve) => {
      socket1.on('connect', async () => {
        expect(true).toBe(true);
        resolve();
      });
    });

    socket1.disconnect();
  });

  it('should emit "OK" on "healthcheck"', async () => {
    const [socket1] = sockets;

    socket1.connect();

    await new Promise<void>((resolve) => {
      socket1.on('connect', () => {
        socket1.emit('healthcheck', 'Hello world!');
        socket1.on('event', (data) => {
          expect(data).toBe('OK');
          resolve();
        });
      });
    });

    socket1.disconnect();
  });

  describe('joinNotificationSockets', () => {
    it('should join socket1 and socket3 to room MESSAGE', async () => {
      const [socket1, , socket3] = sockets;

      [socket1, , socket3].forEach((socket) => socket?.connect());

      for (const socket of [socket1, , socket3]) {
        if (socket) {
          await new Promise<void>((resolve) => {
            socket.on('connect', async () => {
              resolve();
            });
          });
        }
      }

      jest.spyOn(gateway, 'getNotificationSockets').mockResolvedValueOnce(
        (await gateway.io.fetchSockets()).filter(({ handshake }) => {
          const uuid = handshake.headers.sessionid?.toString() || '';

          return validSessionIds.includes(uuid);
        }),
      );

      await gateway.joinNotificationSockets('sessionId', Room.MESSAGE);

      expect(gateway.getNotificationSockets).toHaveBeenCalledWith('sessionId');

      gateway.io.to(Room.MESSAGE).emit('message', { data: 'OK' });

      for (const socket of [socket1, , socket3]) {
        if (socket)
          await new Promise<void>((resolve) => {
            socket.on('message', async ({ data }) => {
              expect(data).toBe('OK');
              resolve();
            });
          });
      }

      sockets.forEach((socket) => socket.disconnect());
    });

    it('should throw an error when socket array is empty', async () => {
      jest.spyOn(gateway, 'getNotificationSockets').mockResolvedValueOnce([]);

      expect(gateway.getNotificationSockets).toHaveBeenCalledWith('sessionId');

      await expect(
        gateway.joinNotificationSockets('sessionId', Room.MESSAGE),
      ).rejects.toThrow('No notification sockets found!');
    });

    it('should throw an error with empty sessionId', async () => {
      await expect(
        gateway.joinNotificationSockets('', Room.MESSAGE),
      ).rejects.toThrow('SessionId is required!');
    });
  });

  describe('getNotificationSockets', () => {
    it('should throw an error with empty sessionId', async () => {
      await expect(gateway.getNotificationSockets('')).rejects.toThrow(
        'SessionId is required!',
      );
    });
  });
});
