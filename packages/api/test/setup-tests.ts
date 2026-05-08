/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as dotenv from 'dotenv';

import { configureJestNetworkEnv } from '@/utils/test/port';

dotenv.config({ path: '../.env' });
configureJestNetworkEnv();

let mockSession = null;

jest.mock('connect-typeorm', () => {
  const store = {
    set: jest.fn((_id, newSession, next) => {
      mockSession = newSession;
      next?.();
    }),
    get: jest.fn((_id, next) => {
      next(null, mockSession);
    }),
    destroy: jest.fn((_id, next) => next?.()),
    touch: jest.fn((_id, _session, next) => next?.()),
  };

  return {
    TypeormStore: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockReturnValue(store),
    })),
  };
});

jest.mock('@resvg/resvg-js', () => {
  return {
    Resvg: jest.fn().mockImplementation(() => ({
      render: jest.fn().mockReturnValue({ asPng: jest.fn() }),
    })),
  };
});

jest.mock('nestjs-dynamic-providers', () => ({
  InjectDynamicProviders: () => (target: unknown) => target,
  resolveDynamicProviders: jest.fn(async () => undefined),
}));

jest.mock('@/logger/logger.service', () => {
  class LoggerService {
    log = jest.fn();

    error = jest.fn();

    warn = jest.fn();

    debug = jest.fn();

    verbose = jest.fn();

    fatal = jest.fn();
  }

  return { LoggerService };
});
