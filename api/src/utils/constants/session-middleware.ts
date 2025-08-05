/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { RequestHandler } from 'express';
import session from 'express-session';

import { config } from '@/config';

import { getSessionStore } from './session-store';

let sessionMiddleware: RequestHandler | null = null;

export const getSessionMiddleware = () => {
  const isProduction = config.env.toLowerCase().includes('prod');

  if (!sessionMiddleware) {
    sessionMiddleware = session({
      name: config.session.name,
      secret: config.session.secret,
      proxy: config.security.trustProxy,
      resave: true,
      saveUninitialized: false,
      store: getSessionStore(),
      cookie: {
        httpOnly: true,
        secure: config.security.httpsEnabled,
        path: '/',
        maxAge: isProduction
          ? 1000 * 60 * 60 * 24 //prod 24h
          : 1000 * 60 * 60, //dev 1h
      },
    });
  }
  return sessionMiddleware;
};
