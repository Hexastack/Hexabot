/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

let mockSession = null;

jest.mock('connect-mongo', () => ({
  create: jest.fn(() => ({
    set: jest.fn((_id, newSession, next) => {
      mockSession = newSession;
      next();
    }),
    get: jest.fn((_id, next) => {
      next(null, mockSession);
    }),
  })),
}));

jest.mock('@resvg/resvg-js', () => {
  return {
    Resvg: jest.fn().mockImplementation(() => ({
      render: jest.fn().mockReturnValue({ asPng: jest.fn() }),
    })),
  };
});
