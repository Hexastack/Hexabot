/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ModulesContainer } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Mutex } from 'async-mutex';

import { LoggerService } from '@/logger/logger.service';

import { SocketRequest } from '../utils/socket-request';
import { SocketResponse } from '../utils/socket-response';

import { SocketEventDispatcherService } from './socket-event-dispatcher.service';

describe('SocketEventDispatcherService', () => {
  let service: SocketEventDispatcherService;
  let logger: jest.Mocked<Pick<LoggerService, 'error'>>;

  beforeEach(() => {
    logger = {
      error: jest.fn(),
    };

    service = new SocketEventDispatcherService(
      new EventEmitter2(),
      new ModulesContainer(),
      logger as unknown as LoggerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createSocketRequest = (path: string): SocketRequest => {
    return {
      path,
      url: path,
      params: {},
      socket: {
        data: {
          mutex: new Mutex(),
        },
      },
      session: {
        reload: (callback: (error: Error | null) => void) => callback(null),
        save: (callback: (error: Error | null) => void) => callback(null),
      },
    } as unknown as SocketRequest;
  };
  const createSocketResponse = (): SocketResponse => {
    return {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as SocketResponse;
  };

  it('matches dynamic socket routes and injects params into SocketRequest', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    (service as any).routeHandlers.get.set('/webhook/:sourceRef', handler);

    const req = createSocketRequest(
      '/api/webhook/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    );
    const res = createSocketResponse();

    await service.handleEvent('get', req.path, req, res);

    expect(handler).toHaveBeenCalledWith(req, res);
    expect(req.params).toEqual({
      sourceRef: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    });
    expect((res.status as jest.Mock).mock.calls).toEqual([]);
  });

  it.each([
    ['/', '/'],
    ['', '/'],
    ['/foo/', '/foo'],
    ['/foo////', '/foo'],
    ['/foo/bar/', '/foo/bar'],
    ['foo', '/foo'],
    ['/' + '/'.repeat(5000), '/'],
  ])(
    'normalizePath(%j) === %j — strips trailing slashes without regex',
    (input, expected) => {
      const result = (service as any).normalizePath(input);
      expect(result).toBe(expected);
    },
  );

  it('returns 404 when no socket route matches', async () => {
    const req = createSocketRequest('/api/unknown/route');
    const res = createSocketResponse();

    await service.handleEvent('get', req.path, req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith({ message: 'Not Found' });
  });
});
