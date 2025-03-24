/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ModulesContainer } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
  };

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly modulesContainer: ModulesContainer,
  ) {}

  async handleEvent(
    socketMethod: SocketMethod,
    path: string,
    req: SocketRequest,
    res: SocketResponse,
  ) {
    try {
      const handlers = this.routeHandlers[socketMethod];
      const foundHandler = Array.from(handlers.entries()).find(([key, _]) => {
        const urlPathname = new URL(req.url, 'http://localhost').pathname;
        const keyUrlPathName = new URL(key, 'http://localhost').pathname;

        return urlPathname === keyUrlPathName;
      });

      if (!foundHandler) {
        return res.status(HttpStatus.NOT_FOUND).send({ message: 'Not Found' });
      }

      const [_, handler] = foundHandler;
      return await handler(req, res);
    } catch (error) {
      return this.handleException(error, res);
    }
  }

  onModuleInit() {
    const allProviders = Array.from(this.modulesContainer.values())
      .map((module) => module.providers.values())
      .reduce(
        (prev, curr) => prev.concat(Array.from(curr)),
        [] as InstanceWrapper<unknown>[],
      )
      .filter((provider) => !!provider.instance);

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

  private handleException(error: Error, res: SocketResponse) {
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
