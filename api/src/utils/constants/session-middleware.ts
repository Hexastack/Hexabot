/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
