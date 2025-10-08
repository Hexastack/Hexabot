/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import SMTPConnection from 'nodemailer/lib/smtp-connection';
import type { ServerOptions, Socket } from 'socket.io';

type TJwtOptions = {
  salt: number;
  secret: string;
  expiresIn: string;
};
type TMethods = 'GET' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD';
type TLogLevel = 'log' | 'fatal' | 'error' | 'warn' | 'debug' | 'verbose';
type TCacheConfig = {
  ttl: number;
  max: number;
  host: string;
  port: number;
  type: 'memory' | 'redis';
};
type SocketCookie =
  | {
      maxAge?: number | undefined;
      name: string;
      path?: string | undefined;
      httpOnly?: boolean | undefined;
      secure?: boolean | undefined;
    }
  | boolean;

export type Config = {
  i18n: { translationFilename: string };
  appPath: string;
  apiBaseUrl: string;
  uiBaseUrl: string;
  security: {
    httpsEnabled: boolean;
    trustProxy: boolean;
    cors: {
      allRoutes: boolean;
      headers: string;
      methods: TMethods[];
      allowOrigins: string[];
      allowCredentials: boolean;
    };
    csrf: boolean;
    csrfExclude: RegExp[];
  };
  sockets: {
    path: string;
    transports: ServerOptions['transports'];
    beforeConnect(_handshake: any): boolean;
    afterDisconnect(_socket: Socket): Promise<void>;
    serveClient: boolean;
    pingTimeout: number;
    pingInterval: number;
    maxHttpBufferSize: number;
    allowUpgrades: boolean;
    cookie: SocketCookie;
    sendResponseHeaders: boolean;
    sendStatusCode: boolean;
    grant3rdPartyCookie: boolean;
    onlyAllowOrigins: string[];
  };
  session: {
    secret: string;
    name: string;
    adapter: string;
    url: string;
    collection: string;
    auto_reconnect: boolean;
    ssl: boolean;
    stringify: boolean;
    cookie: {
      maxAge: number;
    };
  };
  emails: {
    isEnabled: boolean;
    smtp: Partial<SMTPConnection.Options>;
    from: string;
  };
  parameters: {
    uploadDir: string;
    avatarDir: string;
    storageMode: 'disk' | 'memory';
    maxUploadSize: number;
    appName: string;
    signedUrl: TJwtOptions;
  };
  pagination: {
    limit: number;
  };
  chatbot: {
    messages: {
      track_delivery: boolean;
      track_read: boolean;
    };
    logEvents: boolean;
  };
  log: {
    level: TLogLevel;
  };
  cache: TCacheConfig;
  mongo: {
    user: string;
    password: string;
    uri: string;
    dbName: string;
    autoMigrate: boolean;
  };
  env: string;
  authentication: {
    jwtOptions: TJwtOptions;
  };
  invitation: {
    jwtOptions: TJwtOptions;
  };
  password_reset: {
    jwtOptions: TJwtOptions;
  };
  confirm_account: { jwtOptions: TJwtOptions };
  analytics: {
    thresholds: {
      loyalty: number;
      returning: number;
      retention: number;
      retentionReset: number;
    };
  };
};
