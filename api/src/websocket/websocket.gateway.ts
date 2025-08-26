/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import Cookie from 'cookie';
import signature from 'cookie-signature';
import { Request } from 'express';
import { Session as ExpressSession, SessionData } from 'express-session';
import { Server, Socket } from 'socket.io';
import { sync as uid } from 'uid-safe';

import { MessageFull } from '@/chat/schemas/message.schema';
import { Subscriber, SubscriberFull } from '@/chat/schemas/subscriber.schema';
import { OutgoingMessage, StdEventType } from '@/chat/schemas/types/message';
import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
import { getSessionMiddleware } from '@/utils/constants/session-middleware';
import { getSessionStore } from '@/utils/constants/session-store';

import { IOIncomingMessage, IOMessagePipe } from './pipes/io-message.pipe';
import { SocketEventDispatcherService } from './services/socket-event-dispatcher.service';
import { Room } from './types';
import { buildWebSocketGatewayOptions } from './utils/gateway-options';
import { SocketRequest } from './utils/socket-request';
import { SocketResponse } from './utils/socket-response';

@WebSocketGateway(buildWebSocketGatewayOptions())
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2,
    private readonly socketEventDispatcherService: SocketEventDispatcherService,
  ) {}

  @WebSocketServer() io: Server;

  broadcastMessageSent(message: OutgoingMessage): void {
    this.io.to(Room.MESSAGE).emit('message', {
      op: 'messageSent',
      speakerId: message.recipient,
      msg: message,
    });
  }

  broadcastMessageReceived(
    message: MessageFull,
    subscriber: Subscriber | SubscriberFull,
  ): void {
    this.io.to(Room.MESSAGE).emit('message', {
      op: 'messageReceived',
      speakerId: subscriber.id,
      msg: message,
    });
  }

  broadcastMessageDelivered(
    deliveredMessages: string[],
    subscriber: Subscriber | SubscriberFull,
  ): void {
    this.io.to(Room.MESSAGE).emit('message', {
      op: 'messageDelivered',
      speakerId: subscriber.id,
      mids: deliveredMessages,
    });
  }

  broadcastMessageRead(
    watermark: number,
    subscriber: Subscriber | SubscriberFull,
  ): void {
    this.io.to(Room.MESSAGE).emit('message', {
      op: 'messageRead',
      speakerId: subscriber.id,
      watermark,
    });
  }

  broadcastSubscriberNew(subscriber: Subscriber | SubscriberFull) {
    this.io.to(Room.SUBSCRIBER).emit('subscriber', {
      op: 'newSubscriber',
      profile: subscriber,
    });
  }

  broadcastSubscriberUpdate(subscriber: Subscriber | SubscriberFull): void {
    this.io.to(Room.SUBSCRIBER).emit('subscriber', {
      op: 'updateSubscriber',
      profile: subscriber,
    });
  }

  broadcast(
    subscriber: Subscriber,
    type: StdEventType,
    content: any,
    excludedRooms: string[] = [],
  ) {
    this.io.to(subscriber.foreign_id).except(excludedRooms).emit(type, content);
  }

  async createAndStoreSession(client: Socket): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const sid = uid(24); // Sign the session ID before sending
      const signedSid = 's:' + signature.sign(sid, config.session.secret);
      // Send session ID to client to set cookie
      const cookies = Cookie.serialize(
        config.session.name,
        signedSid,
        config.session.cookie,
      );
      const newSession: SessionData = {
        cookie: {
          // Prevent access from client-side javascript
          httpOnly: true,

          // Restrict to path
          path: '/',

          originalMaxAge: config.session.cookie.maxAge,
        },
        passport: { user: {} },
      }; // Initialize your session object as needed
      getSessionStore().set(sid, newSession, (err) => {
        if (err) {
          this.logger.error('Error saving session:', err);
          return reject(new Error('Unable to establish a new socket session'));
        }

        client.emit('set-cookie', cookies);
        // Optionally set the cookie on the client's handshake object if needed
        client.handshake.headers.cookie = cookies;

        this.logger.verbose(`
          Could not fetch session, since connecting socket has no cookie in its handshake.
          Generated a one-time-use cookie:
          ${client.handshake.headers.cookie}
          and saved it on the socket handshake.
  
          > This means the socket started off with an empty session, i.e. (req.session === {})
          > That "anonymous" session will only last until the socket is disconnected. To work around this,
          > make sure the socket sends a 'cookie' header or query param when it initially connects.
          > (This usually arises due to using a non-browser client such as a native iOS/Android app,
          > React Native, a Node.js script, or some other connected device. It can also arise when
          > attempting to connect a cross-origin socket in the browser, particularly for Safari users.
          > To work around this, either supply a cookie manually, or ignore this message and use an
          > approach other than sessions-- e.g. an auth token.)
        `);
        return resolve();
      });
    });
  }

  loadSession(
    sessionID: string,
    next: (err: Error, session: any) => void,
  ): void {
    getSessionStore().get(sessionID, (err, session) => {
      this.logger.verbose('Retrieved socket session', err || session);
      return next(err, session);
    });
  }

  afterInit(): void {
    this.logger.log('Initialized websocket gateway');

    if (config.env !== 'test') {
      // Share the same session middleware (main.ts > express-session)
      this.io.engine.use(getSessionMiddleware());
      this.io.engine.on('initial_headers', (headers, request: Request) => {
        const sessionId = request.session.id;
        if (sessionId) {
          const signedSid =
            's:' + signature.sign(sessionId, config.session.secret);
          const cookie = request.session.cookie;

          // Send session ID to client to set cookie
          const cookies = Cookie.serialize(config.session.name, signedSid, {
            path: cookie.path,
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            expires: cookie.expires,
          });

          headers['Set-Cookie'] = cookies;
        }
      });
    }

    // Handle session
    this.io.use(async (client, next) => {
      this.logger.verbose('Client connected, attempting to load session.');
      try {
        const { searchParams } = new URL(`ws://localhost${client.request.url}`);

        if (config.env === 'test') {
          await this.createAndStoreSession(client);
          next();
          return;
        }
        const session = client.request.session;
        if (
          // Either the WS connection is with an authenticated user
          session.passport?.user?.id
        ) {
          next();
        } else if (
          // Or, the WS connection is established with a chat widget using the web channel (subscriber)
          searchParams.get('channel') === 'web-channel'
        ) {
          session.anonymous =
            typeof session.anonymous === 'undefined' ? true : session.anonymous;
          session.save((err) => {
            if (err) {
              this.logger.error('WS : Unable to save session!', err);
            }
          });
          next();
        } else {
          next(new Error('Unauthorized to connect to WS'));
        }
      } catch (e) {
        this.logger.warn('Something unexpected happening');
        next(e);
      }
    });
  }

  handleConnection(client: Socket, ..._args: any[]): void {
    const { sockets } = this.io.sockets;
    this.logger.log(`Client id: ${client.id} connected`);
    this.logger.debug(`Number of connected clients: ${sockets?.size}`);

    this.eventEmitter.emit(`hook:websocket:connection`, client);
  }

  @OnEvent('hook:user:logout')
  disconnectSockets({ id }: ExpressSession) {
    for (const [, socket] of this.io.sockets.sockets) {
      if (socket.request.session.id === id) {
        socket.disconnect(true);
      }
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client id: ${client.id} disconnected`);
    // Configurable custom afterDisconnect logic here
    // (default: do nothing)
    if (!config.sockets.afterDisconnect) {
      return;
    }

    try {
      // Check if the afterDisconnect logic is an asynchronous function
      await config.sockets.afterDisconnect(client);
    } catch (e) {
      // Catch synchronous errors
      this.logger.error(
        'Error in `config.sockets.afterDisconnect` lifecycle callback:',
        e,
      );
    }
  }

  @SubscribeMessage('healthcheck')
  handleHealthCheck() {
    return { event: 'event', data: 'OK' };
  }

  @SubscribeMessage('get')
  handleGet(
    @MessageBody(new IOMessagePipe()) payload: IOIncomingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const request = new SocketRequest(client, 'get', payload);
    const response = new SocketResponse();
    this.socketEventDispatcherService.handleEvent(
      'get',
      payload.url,
      request,
      response,
    );
    return response.getPromise();
  }

  @SubscribeMessage('post')
  handlePost(
    @MessageBody(new IOMessagePipe()) payload: IOIncomingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const request = new SocketRequest(client, 'post', payload);
    const response = new SocketResponse();
    this.socketEventDispatcherService.handleEvent(
      'post',
      payload.url,
      request,
      response,
    );
    return response.getPromise();
  }

  @SubscribeMessage('put')
  handlePut(
    @MessageBody(new IOMessagePipe()) payload: IOIncomingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const request = new SocketRequest(client, 'put', payload);
    const response = new SocketResponse();
    this.socketEventDispatcherService.handleEvent(
      'put',
      payload.url,
      request,
      response,
    );
    return response.getPromise();
  }

  @SubscribeMessage('patch')
  handlePatch(
    @MessageBody(new IOMessagePipe()) payload: IOIncomingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const request = new SocketRequest(client, 'patch', payload);
    const response = new SocketResponse();
    this.socketEventDispatcherService.handleEvent(
      'patch',
      payload.url,
      request,
      response,
    );
    return response.getPromise();
  }

  @SubscribeMessage('delete')
  handleDelete(
    @MessageBody(new IOMessagePipe()) payload: IOIncomingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const request = new SocketRequest(client, 'delete', payload);
    const response = new SocketResponse();
    this.socketEventDispatcherService.handleEvent(
      'delete',
      payload.url,
      request,
      response,
    );
    return response.getPromise();
  }

  @SubscribeMessage('options')
  handleOptions(
    @MessageBody(new IOMessagePipe()) payload: IOIncomingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const request = new SocketRequest(client, 'options', payload);
    const response = new SocketResponse();
    this.socketEventDispatcherService.handleEvent(
      'options',
      payload.url,
      request,
      response,
    );
    return response.getPromise();
  }

  @SubscribeMessage('head')
  handleHead(
    @MessageBody(new IOMessagePipe()) payload: IOIncomingMessage,
    @ConnectedSocket() client: Socket,
  ) {
    const request = new SocketRequest(client, 'head', payload);
    const response = new SocketResponse();
    this.socketEventDispatcherService.handleEvent(
      'head',
      payload.url,
      request,
      response,
    );
    return response.getPromise();
  }

  /**
   * Allows a given socket to join a notification room.
   *
   * @param req - Socket request
   * @param room - The room name
   */
  async joinNotificationSockets(req: SocketRequest, room: Room): Promise<void> {
    if (!req.session.passport?.user?.id) {
      throw new Error(
        'Only authenticated users are allowed to join notification rooms!',
      );
    }

    return await req.socket.join(room);
  }
}
