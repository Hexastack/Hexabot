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
import cookie from 'cookie';
import * as cookieParser from 'cookie-parser';
import signature from 'cookie-signature';
import { Session as ExpressSession, SessionData } from 'express-session';
import { Server, Socket } from 'socket.io';
import { sync as uid } from 'uid-safe';

import { MessageFull } from '@/chat/schemas/message.schema';
import {
  Subscriber,
  SubscriberFull,
  SubscriberStub,
} from '@/chat/schemas/subscriber.schema';
import { OutgoingMessage, StdEventType } from '@/chat/schemas/types/message';
import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';
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

  broadcast(subscriber: Subscriber, type: StdEventType, content: any) {
    this.io.to(subscriber.foreign_id).emit(type, content);
  }

  createAndStoreSession(client: Socket, next: (err?: Error) => void): void {
    const sid = uid(24); // Sign the sessionID before sending
    const signedSid = 's:' + signature.sign(sid, config.session.secret);
    // Send session ID to client to set cookie
    const cookies = cookie.serialize(
      config.session.name,
      signedSid,
      config.session.cookie,
    );
    const newSession: SessionData<SubscriberStub> = {
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
        return next(new Error('Unable to establish a new socket session'));
      }

      client.emit('set-cookie', cookies);
      // Optionally set the cookie on the client's handshake object if needed
      client.handshake.headers.cookie = cookies;
      client.data.session = newSession;
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
      return next();
    });
  }

  saveSession(client: Socket): void {
    const { sessionID, session } = client.data;
    if (!sessionID || !session) {
      this.logger.warn('No socket session found ...');
      return;
    }

    // On disconnect we may want to update the session, but
    // it shouldn't save it if the user logged out (session destroyed)
    this.loadSession(sessionID, (err, oldSession) => {
      if (err || !oldSession) {
        this.logger.debug(
          'Unable to save websocket session, probably the user logged out ...',
        );
        return;
      }
      getSessionStore().set(sessionID, session, (err) => {
        if (err) {
          this.logger.error(
            'Error saving session in `config.sockets.afterDisconnect`:',
            err,
          );
          throw err;
        }
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

    // Handle session
    this.io.use((client, next) => {
      this.logger.verbose('Client connected, attempting to load session.');
      try {
        const { searchParams } = new URL(`ws://localhost${client.request.url}`);

        if (client.request.headers.cookie) {
          const cookies = cookie.parse(client.request.headers.cookie);
          if (cookies && config.session.name in cookies) {
            const sessionID = cookieParser.signedCookie(
              cookies[config.session.name],
              config.session.secret,
            );
            if (sessionID) {
              return this.loadSession(sessionID, (err, session) => {
                if (err || !session) {
                  this.logger.warn(
                    'Unable to load session, creating a new one ...',
                    err,
                  );
                  if (searchParams.get('channel') !== 'console-channel') {
                    return this.createAndStoreSession(client, next);
                  } else {
                    return next(new Error('Unauthorized: Unknown session ID'));
                  }
                }
                client.data.session = session;
                client.data.sessionID = sessionID;
                next();
              });
            } else {
              return next(new Error('Unable to parse session ID from cookie'));
            }
          }
        } else if (searchParams.get('channel') === 'web-channel') {
          return this.createAndStoreSession(client, next);
        } else {
          return next(new Error('Unauthorized to connect to WS'));
        }
      } catch (e) {
        this.logger.warn('Something unexpected happening');
        return next(e);
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
      if (socket.data['sessionID'] === id) {
        socket.disconnect(true);
      }
    }
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.logger.log(`Client id:${client.id} disconnected`);
    // Configurable custom afterDisconnect logic here
    // (default: do nothing)
    if (!config.sockets.afterDisconnect) {
      return;
    }

    try {
      // Check if the afterDisconnect logic is an asynchronous function
      await config.sockets.afterDisconnect(client);

      this.saveSession(client);
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
}
