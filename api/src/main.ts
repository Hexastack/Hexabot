/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import bodyParser from 'body-parser';
import session from 'express-session';
import moduleAlias from 'module-alias';
import { resolveDynamicProviders } from 'nestjs-dynamic-providers';
import passport from 'passport';

moduleAlias.addAliases({
  '@': __dirname,
});

import { AppInstance } from './app.instance';
import { HexabotModule } from './app.module';
import { config } from './config';
import { seedDatabase } from './seeder';
import { SettingService } from './setting/services/setting.service';
import { swagger } from './swagger';
import { getSessionStore } from './utils/constants/session-store';
import { ObjectIdPipe } from './utils/pipes/object-id.pipe';
import { RedisIoAdapter } from './websocket/adapters/redis-io.adapter';

async function bootstrap() {
  const isProduction = config.env.toLowerCase().includes('prod');

  await resolveDynamicProviders();
  const app = await NestFactory.create(HexabotModule, {
    bodyParser: false,
  });

  // Set the global app instance
  AppInstance.setApp(app);

  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf?.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };
  app.use(bodyParser.urlencoded({ verify: rawBodyBuffer, extended: true }));
  app.use(bodyParser.json({ verify: rawBodyBuffer }));

  const settingService = app.get<SettingService>(SettingService);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
      } else {
        settingService
          .getAllowedOrigins()
          .then((allowedOrigins) => {
            if (allowedOrigins.includes(origin)) {
              callback(null, true);
            } else {
              callback(new Error(`Not allowed by CORS : ${origin}`));
            }
          })
          .catch(callback);
      }
    },
    methods: config.security.cors.methods,
    credentials: config.security.cors.allowCredentials,
    allowedHeaders: config.security.cors.headers.split(','),
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      // forbidNonWhitelisted: true,
    }),
    new ObjectIdPipe(),
  );
  app.use(
    session({
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
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  if (config.cache.type === 'redis') {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  }

  /**
   * Global handler for uncaught exceptions in the Node.js process.
   * Logs all uncaught exceptions directly to stderr using ConsoleLogger,
   *
   * ⚠️  Do NOT perform any async operations here. The process may be unstable,
   * and async code may not execute as expected. This handler is for last-resort
   * synchronous logging only.
   *
   * @see https://nodejs.org/api/process.html#event-uncaughtexception
   */
  process.on('uncaughtException', (error) => {
    const logger = new ConsoleLogger('UncaughtException');

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : null;
    const errorName = error instanceof Error ? error.name : 'Unknown';

    // Create a clear, comprehensive log entry
    logger.error(`
┌─ UNHANDLED EXCEPTION ──────────────────────────────
│ Error: ${errorMessage}
│ Type: ${errorName}
│ Time: ${new Date().toISOString()}
${
  errorStack
    ? `│ Stack:\n${errorStack
        .split('\n')
        .map((line) => `│   ${line}`)
        .join('\n')}`
    : '│ Stack: Not available'
}
└───────────────────────────────────────────────────`);
  });

  /**
   * Global handler for unhandled promise rejections in the Node.js process.
   * Logs all unhandled promise rejections with detailed error information.
   *
   * ⚠️  Do NOT perform any async operations here. Keep operations synchronous
   * and minimal to ensure reliable logging before potential process termination.
   *
   * @see https://nodejs.org/api/process.html#event-unhandledrejection
   */
  process.on('unhandledRejection', (reason, _promise) => {
    const logger = new ConsoleLogger('unhandledRejection');

    const errorMessage =
      reason instanceof Error ? reason.message : String(reason);
    const errorStack = reason instanceof Error ? reason.stack : null;
    const errorName = reason instanceof Error ? reason.name : 'Unknown';

    logger.error(`
┌─ UNHANDLED PROMISE REJECTION ─────────────────────
│ Error: ${errorMessage}
│ Type: ${errorName}
│ Time: ${new Date().toISOString()}
${
  errorStack
    ? `│ Stack:\n${errorStack
        .split('\n')
        .map((line) => `│   ${line}`)
        .join('\n')}`
    : '│ Stack: Not available'
}
└───────────────────────────────────────────────────`);
  });

  if (!isProduction) {
    await seedDatabase(app);
    swagger(app);
  }

  await app.listen(3000);
}

bootstrap();
