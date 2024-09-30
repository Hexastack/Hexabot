/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
