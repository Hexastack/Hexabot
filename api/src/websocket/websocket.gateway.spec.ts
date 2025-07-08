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

import { UserRepository } from '@/user/repositories/user.repository';
import { User } from '@/user/schemas/user.schema';
import { installSubscriberFixtures } from '@/utils/test/fixtures/subscriber';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { SocketEventDispatcherService } from './services/socket-event-dispatcher.service';
import { Room } from './types';
import { SocketRequest } from './utils/socket-request';
import { SocketResponse } from './utils/socket-response';
import { WebsocketGateway } from './websocket.gateway';

describe('WebsocketGateway', () => {
  let gateway: WebsocketGateway;
  let app: INestApplication;
  let createSocket: (index: number) => Socket;
  let sockets: Socket[];
  // eslint-disable-next-line
  let messageRoomSockets: Socket[];
  let uuids: string[];
  let validUuids: string[];
  let allUsers: User[];
  let userRepository: UserRepository;
  const SESSION_ID = 'sessionId';
  let buildReqRes: (
    method: 'GET' | 'POST',
    subscriberId: string,
  ) => [SocketRequest, SocketResponse];

  beforeAll(async () => {
    // Instantiate the app
    const { getMocks, module } = await buildTestingMocks({
      providers: [WebsocketGateway, SocketEventDispatcherService],
      imports: [
        rootMongooseTestModule(async ({ uri, dbName }) => {
          await installSubscriberFixtures();
          process.env.MONGO_URI = uri;
          process.env.MONGO_DB = dbName;
          return Promise.resolve();
        }),
      ],
      autoInjectFrom: ['providers'],
    });
    app = module.createNestApplication();
    // Get the gateway instance from the app instance
    gateway = app.get<WebsocketGateway>(WebsocketGateway);
    // Create a new client that will interact with the gateway

    uuids = [uuidv4(), uuidv4(), uuidv4()];
    validUuids = [uuids[0], uuids[2]];

    createSocket = (index: number) =>
      io('http://localhost:3000', {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        // path: '/socket.io/?EIO=4&transport=websocket&channel=web-channel',
        query: { EIO: '4', transport: 'websocket', channel: 'web-channel' },
        extraHeaders: { uuid: uuids[index] },
      });

    sockets = uuids.map((_e, index) => createSocket(index));
    messageRoomSockets = sockets.filter((socket) =>
      validUuids.includes(socket?.io.opts.extraHeaders?.['uuid'] || ''),
    );

    await app.listen(3000);

    [userRepository] = await getMocks([UserRepository]);
    allUsers = await userRepository.findAll();

    buildReqRes = (method: 'GET' | 'POST', userId: string) => [
      {
        sessionID: SESSION_ID,
        method,
        session: { passport: { user: { id: userId } } },
      } as SocketRequest,
      {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
      } as any,
    ];
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
    // it('should make socket1 and socket3 join the room MESSAGE', async () => {
    //   messageRoomSockets.forEach((socket) => socket.connect());

    //   for (const socket of messageRoomSockets) {
    //     await new Promise<void>((resolve) => socket.on('connect', resolve));
    //   }

    //   const serverSockets = await gateway.io.fetchSockets();

    //   expect(serverSockets.length).toBe(2);

    //   jest.spyOn(gateway, 'getNotificationSockets').mockResolvedValueOnce(
    //     serverSockets.filter(({ handshake: { headers } }) => {
    //       const uuid = headers.uuid?.toString() || '';

    //       return validUuids.includes(uuid);
    //     }),
    //   );

    //   await gateway.joinNotificationSockets('sessionId', Room.MESSAGE);

    //   gateway.io.to(Room.MESSAGE).emit('message', { data: 'OK' });

    //   for (const socket of messageRoomSockets) {
    //     await new Promise<void>((resolve) => {
    //       socket.on('message', async ({ data }) => {
    //         expect(data).toBe('OK');
    //         resolve();
    //       });
    //     });
    //   }

    //   messageRoomSockets.forEach((socket) => socket.disconnect());
    // });

    it('should throw an error when socket array is empty', async () => {
      jest.spyOn(gateway, 'getNotificationSockets').mockResolvedValueOnce([]);
      const [req] = buildReqRes('GET', allUsers[0].id);

      await expect(
        gateway.joinNotificationSockets(req, Room.MESSAGE, 'message'),
      ).rejects.toThrow('No notification sockets found!');

      expect(gateway.getNotificationSockets).toHaveBeenCalledWith('sessionId');
    });

    it('should throw an error with empty sessionId', async () => {
      const [req] = buildReqRes('GET', allUsers[0].id);
      req.sessionID = '';
      await expect(
        gateway.joinNotificationSockets(req, Room.MESSAGE, 'message'),
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
