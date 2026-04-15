/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NextFunction, Request, Response } from 'express';

import { ChannelMiddleware } from './channel.middleware';

describe('ChannelMiddleware', () => {
  it('resolves channel for paths that include /api prefix', async () => {
    const next = jest.fn() as unknown as NextFunction;
    const channel = {
      middleware: jest.fn().mockImplementation(async (_req, _res, cb) => cb()),
    };
    const channelService = {
      getChannelHandler: jest.fn().mockReturnValue(channel),
    };
    const middleware = new ChannelMiddleware(channelService as any);
    const req = {
      path: '/api/webhook/facebook',
      originalUrl: '/api/webhook/facebook',
      url: '/api/webhook/facebook',
    } as unknown as Request;

    await middleware.use(req, {} as Response, next);

    expect(channelService.getChannelHandler).toHaveBeenCalledWith(
      'facebook-channel',
    );
    expect(channel.middleware).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('resolves channel for direct /webhook path', async () => {
    const next = jest.fn() as unknown as NextFunction;
    const channel = {
      middleware: jest.fn().mockImplementation(async (_req, _res, cb) => cb()),
    };
    const channelService = {
      getChannelHandler: jest.fn().mockReturnValue(channel),
    };
    const middleware = new ChannelMiddleware(channelService as any);
    const req = {
      path: '/webhook/facebook',
      originalUrl: '/webhook/facebook',
      url: '/webhook/facebook',
    } as unknown as Request;

    await middleware.use(req, {} as Response, next);

    expect(channelService.getChannelHandler).toHaveBeenCalledWith(
      'facebook-channel',
    );
    expect(channel.middleware).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('bypasses non-webhook paths', async () => {
    const next = jest.fn() as unknown as NextFunction;
    const channelService = {
      getChannelHandler: jest.fn(),
    };
    const middleware = new ChannelMiddleware(channelService as any);
    const req = {
      path: '/api/health',
      originalUrl: '/api/health',
      url: '/api/health',
    } as unknown as Request;

    await middleware.use(req, {} as Response, next);

    expect(channelService.getChannelHandler).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it('forwards middleware resolution errors', async () => {
    const next = jest.fn() as unknown as NextFunction;
    const channelService = {
      getChannelHandler: jest.fn().mockImplementation(() => {
        throw new Error('boom');
      }),
    };
    const middleware = new ChannelMiddleware(channelService as any);
    const req = {
      path: '/api/webhook/facebook',
      originalUrl: '/api/webhook/facebook',
      url: '/api/webhook/facebook',
    } as unknown as Request;

    await middleware.use(req, {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Unable to execute middleware on route /api/webhook/facebook',
      }),
    );
  });
});
