/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Subscriber } from '@hexabot-ai/types';
import { Inject, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';

import { StdEventType } from '@/chat/types/message';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WebsocketGateway } from '@/websocket/websocket.gateway';

import { ChannelName } from '../../types';
import ChannelHandler from '../Handler';

/**
 * Abstract base for channels that communicate over Socket.IO (WebSocket transport).
 *
 * Provides transport-level plumbing:
 *  - HTTP-request guard (rejects plain HTTP with 403)
 *  - GET / POST routing to protected abstract hook methods
 *  - `broadcast()` via the shared WebsocketGateway
 *  - `sendTypingIndicator()` helper
 *  - `isSocketRequest()` type-guard utility
 *  - `getIpAddress()` utility
 *
 * Concrete channel implementations should extend this class (directly or via
 * an intermediate base like BaseWebChannelHandler) and implement:
 *  - `processSocketGet(req, res)` — subscription / disconnect flows
 *  - `processSocketPost(req, res, workflowId?)` — incoming message flows
 *  - `sendMessage(event, envelope, options)` — outbound delivery
 *  - `getSubscriberData(event)` — subscriber profile extraction
 */
@Injectable()
export abstract class WebSocketChannelHandler<
  N extends ChannelName,
> extends ChannelHandler<N> {
  @Inject(WebsocketGateway)
  protected readonly websocketGateway: WebsocketGateway;

  /**
   * Type-guard: returns true when `req` is a synthetic SocketRequest
   * (created by the Socket.IO dispatcher) rather than a plain Express request.
   */
  isSocketRequest(req: Request | SocketRequest): req is SocketRequest {
    return 'isSocket' in req && req.isSocket;
  }

  /**
   * Returns the remote IP address of the connected socket client.
   */
  protected getIpAddress(req: SocketRequest): string {
    return req.socket.handshake.address;
  }

  /**
   * Broadcasts a typed event to all Socket.IO rooms belonging to a subscriber.
   *
   * @param excludedRooms - Socket IDs to skip (e.g. the originating socket).
   */
  protected broadcast(
    subscriber: Subscriber,
    type: StdEventType,
    content: unknown,
    excludedRooms: string[] = [],
  ): void {
    this.websocketGateway.broadcast(subscriber, type, content, excludedRooms);
  }

  /**
   * Emits a typing indicator to the subscriber, then clears it after
   * `timeout` milliseconds.
   */
  async sendTypingIndicator(
    recipient: Subscriber,
    timeout: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.broadcast(recipient, StdEventType.typing, true);
        setTimeout(() => {
          this.broadcast(recipient, StdEventType.typing, false);
          resolve();
        }, timeout);
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Handle an incoming GET request that arrived over the WebSocket transport.
   * Typically used for subscription / disconnect flows.
   */
  protected abstract processSocketGet(
    req: SocketRequest,
    res: Response | SocketResponse,
  ): Promise<void>;

  /**
   * Handle an incoming POST request that arrived over the WebSocket transport.
   * Typically used for inbound message processing.
   */
  protected abstract processSocketPost(
    req: SocketRequest,
    res: Response | SocketResponse,
    workflowId?: string,
  ): Promise<void>;

  /**
   * Entry point called by ChannelService / WebhookController for every request.
   *
   * Rejects plain HTTP with 403 (web channels require the Socket.IO transport),
   * then routes GET / POST to the concrete hook methods.
   */
  async handle(
    req: Request | SocketRequest,
    res: Response | SocketResponse,
    workflowId?: string,
  ): Promise<void> {
    if (!this.isSocketRequest(req)) {
      this.logger.warn(
        'Web channel over HTTP is no longer supported. Use Socket.IO transport.',
      );

      return void res
        .status(403)
        .json({ err: 'Web Channel Handler : Unauthorized!' });
    }

    if (req.method === 'GET') {
      return this.processSocketGet(req, res);
    }

    return this.processSocketPost(req, res, workflowId);
  }
}
