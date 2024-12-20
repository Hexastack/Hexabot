/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { join } from 'path';

import { Config } from './types';

export const config: Config = {
  i18n: {
    translationFilename: process.env.I18N_TRANSLATION_FILENAME || 'messages',
  },
  appPath: process.cwd(),
  apiBaseUrl: process.env.API_ORIGIN || 'http://localhost:4000',
  uiBaseUrl: process.env.FRONTEND_BASE_URL
    ? process.env.FRONTEND_BASE_URL
    : 'http://localhost:8080', // default to local dev
  security: {
    httpsEnabled: process.env.HTTPS_ENABLED === 'true',
    trustProxy: process.env.HTTPS_ENABLED === 'true', // Nginx in use ?
    cors: {
      allRoutes: true,
      headers: 'content-type,x-xsrf-token,x-csrf-token',
      methods: ['GET', 'PATCH', 'POST', 'DELETE', 'OPTIONS', 'HEAD'],
      allowOrigins: process.env.FRONTEND_ORIGIN
        ? process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim())
        : ['*'],
      allowCredentials: true,
    },
    csrf: true,
  },
  sockets: {
    path: '/socket.io',
    // transports to allow connections to (e.g. ['polling', 'websocket'])
    transports: ['websocket'],
    beforeConnect(_handshake: any): boolean {
      // `true` allows the socket to connect.
      // (`false` would reject the connection)
      return true;
    },
    async afterDisconnect(_socket): Promise<void> {
      // By default: do nothing.
      // (but always trigger the callback)
      return;
    },
    serveClient: false,
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 10e7,
    allowUpgrades: true,
    cookie: false,
    // Whether to include response headers in the JWR originated for
    // each socket request (e.g. `io.socket.get()` in the browser)
    // This doesn't affect direct socket.io usage-- only if you're
    // communicating with Sails via the request interpreter
    // (e.g. the sails.io.js browser SDK)
    sendResponseHeaders: true,

    // Whether to include the status code in the JWR originated for
    // each socket request (e.g. `io.socket.get()` in the browser)
    // This doesn't affect direct socket.io usage-- only if you're
    // communicating with Sails via the request interpreter
    // (e.g. the sails.io.js browser SDK)
    sendStatusCode: true,

    // Whether to expose a 'get /__getcookie' route with CORS support
    // that sets a cookie (this is used by the sails.io.js socket client
    // to get access to a 3rd party cookie and to enable sessions).
    grant3rdPartyCookie: true,
    onlyAllowOrigins: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim())
      : [undefined], // ['http://example.com', 'https://example.com'],
  },
  session: {
    secret: process.env.SESSION_SECRET || 'changeme',
    name: process.env.SESSION_NAME || 'hex.sid',
    adapter: 'connect-mongo',
    url: 'mongodb://localhost:27017/hexabot',
    collection: 'sessions',
    auto_reconnect: false,
    ssl: false,
    stringify: true,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  },
  emails: {
    isEnabled: process.env.EMAIL_SMTP_ENABLED === 'true' || false,
    smtp: {
      port: parseInt(process.env.EMAIL_SMTP_PORT) || 25,
      host: process.env.EMAIL_SMTP_HOST || 'localhost',
      ignoreTLS: false,
      secure: process.env.EMAIL_SMTP_SECURE === 'true' || false,
      auth: {
        user: process.env.EMAIL_SMTP_USER || '',
        pass: process.env.EMAIL_SMTP_PASS || '',
      },
    },
    from: process.env.EMAIL_SMTP_FROM || 'noreply@example.com',
  },
  parameters: {
    uploadDir: process.env.UPLOAD_DIR
      ? join(process.cwd(), process.env.UPLOAD_DIR)
      : join(process.cwd(), 'uploads'),
    avatarDir: process.env.AVATAR_DIR
      ? join(process.cwd(), process.env.AVATAR_DIR)
      : join(process.cwd(), 'avatars'),
    storageMode: 'disk',
    maxUploadSize: process.env.UPLOAD_MAX_SIZE_IN_BYTES
      ? Number(process.env.UPLOAD_MAX_SIZE_IN_BYTES)
      : 2000000,
    appName: 'Hexabot.ai',
  },
  pagination: {
    limit: 10,
  },
  chatbot: {
    messages: {
      track_delivery: false,
      track_read: false,
    },
    logEvents: false,
  },
  log: {
    level: 'verbose',
  },
  cache: {
    type: process.env.REDIS_ENABLED === 'true' ? 'redis' : 'memory',
    ttl: 60 * 1000, // Milliseconds
    max: 100, // Maximum number of items in cache (defaults to 100)
    host: process.env.REDIS_HOST || 'redis',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  mongo: {
    user: process.env.MONGO_USER || 'dev_only',
    password: process.env.MONGO_PASSWORD || 'dev_only',
    uri: process.env.MONGO_URI || 'mongodb://dev_only:dev_only@mongo:27017/',
    dbName: process.env.MONGO_DB || 'hexabot',
  },
  env: process.env.NODE_ENV || 'development',
  authentication: {
    jwtOptions: {
      salt: parseInt(process.env.SALT_LENGTH || '12'),
      secret: process.env.JWT_SECRET || 'DEFAULT_AUTH_SECRET',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
  },
  invitation: {
    jwtOptions: {
      salt: parseInt(process.env.SALT_LENGTH || '12'),
      secret: process.env.INVITATION_JWT_SECRET || 'DEFAULT_INVITATION_SECRET',
      expiresIn: process.env.INVITATION_EXPIRES_IN || '24h',
    },
  },
  password_reset: {
    jwtOptions: {
      salt: parseInt(process.env.SALT_LENGTH || '12'),
      secret:
        process.env.PASSWORD_RESET_SECRET || 'DEFAULT_PASSWORD_RESET_SECRET',
      expiresIn: process.env.PASSWORD_RESET_EXPIRES_IN || '1H',
    },
  },
  confirm_account: {
    jwtOptions: {
      salt: parseInt(process.env.SALT_LENGTH || '12'),
      secret:
        process.env.CONFIRM_ACCOUNT_SECRET || 'DEFAULT_CONFIRM_ACCOUNT_SECRET',
      expiresIn: process.env.CONFIRM_ACCOUNT_EXPIRES_IN || '1H',
    },
  },
  analytics: {
    thresholds: {
      loyalty: 5 * 24 * 60 * 60 * 1000, // 5 days
      returning: 20 * 60 * 60 * 1000, // 20 hours
      retention: 3 * 24 * 60 * 60 * 1000, // 3 days
      retentionReset: 24 * 60 * 60 * 1000, // 1 day
    },
  },
};
