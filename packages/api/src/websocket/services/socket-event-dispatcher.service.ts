/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Mutex } from 'async-mutex';
import { Socket } from 'socket.io';

import { AppInstance } from '@/app.instance';
import { config } from '@/config';
import { LoggerService } from '@/logger/logger.service';

import { SocketEventMetadataStorage } from '../storage/socket-event-metadata.storage';
import { SocketRequest } from '../utils/socket-request';
import { SocketResponse } from '../utils/socket-response';

type Handler = (req: any, res: SocketResponse) => Promise<any>;

export type SocketMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | string;

@Injectable()
export class SocketEventDispatcherService implements OnModuleInit {
  private routeHandlers: { [key: SocketMethod]: Map<string, Handler> } = {
    get: new Map(),
    post: new Map(),
    put: new Map(),
    patch: new Map(),
    delete: new Map(),
    options: new Map(),
    head: new Map(),
  };

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly modulesContainer: ModulesContainer,
    private readonly logger: LoggerService,
  ) {}

  @OnEvent('hook:websocket:connection')
  handleConnection(client: Socket) {
    client.data.mutex = new Mutex();
  }

  async handleEvent(
    socketMethod: SocketMethod,
    _path: string,
    req: SocketRequest,
    res: SocketResponse,
  ) {
    // Prevent racing conditions from the same socket
    const socketData = req.socket.data;
    const release = await socketData.mutex.acquire();

    try {
      const handlers = this.routeHandlers[socketMethod];
      if (!handlers) {
        return res.status(HttpStatus.NOT_FOUND).send({ message: 'Not Found' });
      }

      const incomingPath = this.normalizeIncomingPath(req.path);
      const foundHandler = Array.from(handlers.entries()).find(
        ([routePath, _]) => {
          const params = this.matchPath(routePath, incomingPath);

          if (!params) {
            return false;
          }

          req.params = params;

          return true;
        },
      );

      if (!foundHandler) {
        return res.status(HttpStatus.NOT_FOUND).send({ message: 'Not Found' });
      }

      const [_, handler] = foundHandler;

      await new Promise<Error | void>(async (resolve, reject) => {
        req.session.reload((error) => {
          if (error) {
            reject(new UnauthorizedException());
          } else {
            resolve();
          }
        });
      });

      const response = await handler(req, res);

      // Update session object (similar to what is done in express-session)
      await new Promise<void>((resolve) => {
        req.session.save((err) => {
          if (err) {
            this.logger.error('WS : Unable to update session!', err);
          }
          resolve();
        });
      });

      return response;
    } catch (error) {
      this.logger.error('Error while handling Web-socket event', error);

      return this.handleException(error, req, res);
    } finally {
      release();
    }
  }

  private normalizeIncomingPath(path: string): string {
    const normalizedPath = this.normalizePath(path);
    const apiPrefix = this.normalizePath(new URL(config.apiBaseUrl).pathname);

    if (
      apiPrefix !== '/' &&
      (normalizedPath === apiPrefix ||
        normalizedPath.startsWith(`${apiPrefix}/`))
    ) {
      const withoutPrefix = normalizedPath.slice(apiPrefix.length) || '/';

      return this.normalizePath(withoutPrefix);
    }

    return normalizedPath;
  }

  private normalizePath(path: string): string {
    if (!path || path === '/') {
      return '/';
    }

    const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
    const withoutTrailingSlash =
      withLeadingSlash.length > 1
        ? withLeadingSlash.replace(/\/+$/, '')
        : withLeadingSlash;

    return withoutTrailingSlash;
  }

  private matchPath(
    pattern: string,
    path: string,
  ): Record<string, string> | null {
    const normalizedPattern = this.normalizePath(pattern);
    const normalizedPath = this.normalizePath(path);
    const patternSegments = normalizedPattern.split('/').filter(Boolean);
    const pathSegments = normalizedPath.split('/').filter(Boolean);

    if (patternSegments.length !== pathSegments.length) {
      return null;
    }

    const params: Record<string, string> = {};

    for (let i = 0; i < patternSegments.length; i += 1) {
      const patternSegment = patternSegments[i];
      const pathSegment = pathSegments[i];

      if (patternSegment.startsWith(':')) {
        const paramName = patternSegment.slice(1);

        if (!paramName) {
          return null;
        }

        params[paramName] = decodeURIComponent(pathSegment);
        continue;
      }

      if (patternSegment !== pathSegment) {
        return null;
      }
    }

    return params;
  }

  onModuleInit() {
    if (!AppInstance.isReady()) {
      return;
    }

    const allProviders = Array.from(this.modulesContainer.values())
      .map(
        (module) =>
          module.providers.values() as MapIterator<InstanceWrapper<object>>,
      )
      .reduce(
        (prev, curr) => prev.concat(Array.from(curr)),
        [] as InstanceWrapper<object>[],
      )
      .filter((provider) => !!provider.instance)
      .filter((provider, idx, self) => {
        const matchIdx = self.findIndex((p) => p.name === provider.name);

        return matchIdx === idx;
      });

    for (const provider of allProviders) {
      const instance = provider.instance;
      const events = SocketEventMetadataStorage.getMetadataFor(instance);
      events.forEach((event) => {
        // Error Handling
        if (this.routeHandlers[event.socketMethod] === undefined) {
          throw new Error(`Invalid event type: ${event.socketMethod}`);
        }

        if (this.routeHandlers[event.socketMethod].has(event.path)) {
          throw new Error(
            `Duplicate event: ${event.socketMethod} ${event.path}`,
          );
        }

        // add event handler
        this.routeHandlers[event.socketMethod].set(
          event.path,
          // bind the method to the instance
          event.method.bind(instance),
        );
      });
    }
  }

  private handleException(
    error: Error,
    { socket }: SocketRequest,
    res: SocketResponse,
  ) {
    this.eventEmitter.emit('hook:websocket:error', socket, error);

    if (error instanceof HttpException) {
      // Handle known HTTP exceptions
      return res.status(error.getStatus()).send(error.getResponse());
    } else {
      // Handle generic errors
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .send({ message: 'Internal Server Error' });
    }
  }
}
