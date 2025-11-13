/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import 'dotenv/config';

import { config, csrf } from '@hexabot/config';
import { UuidPipe } from '@hexabot/core/pipes';
import { SettingService } from '@hexabot/setting';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import bodyParser from 'body-parser';
import moduleAlias from 'module-alias';
import { resolveDynamicProviders } from 'nestjs-dynamic-providers';
import passport from 'passport';

moduleAlias.addAliases({
  '@': __dirname,
});

import { AppInstance } from './app.instance';
import { HexabotModule } from './app.module';
import { seedDatabase } from './seeder';
import { swagger } from './swagger';
import { getSessionMiddleware } from './utils/constants/session-middleware';
import { RedisIoAdapter } from './websocket/adapters/redis-io.adapter';

async function bootstrap() {
  const isProduction = config.env.toLowerCase().includes('prod');

  await resolveDynamicProviders();
  const app = await NestFactory.create<NestExpressApplication>(HexabotModule, {
    bodyParser: false,
  });

  // In Express v5, query parameters are no longer parsed using the qs library by default.
  // As a result, query strings like these: ?filter[where][name]=John&filter[where][age]=30
  // That's why we need to use the extended parser (the default in Express v4) by setting the query parser option to extended
  app.set('query parser', 'extended');

  // Set the global app instance
  AppInstance.setApp(app);

  // Prefix only when app mode is monolith
  if (config.mode === 'monolith') {
    app.setGlobalPrefix(config.apiPrefix);
  }

  // Disable Express "X-Powered-By" header for all environments
  app.getHttpAdapter().getInstance().disable('x-powered-by');

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
            if (allowedOrigins.includes(origin) || true) {
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
    new UuidPipe(),
  );
  app.use(getSessionMiddleware());
  app.use(passport.initialize());
  app.use(passport.session());

  // CSRF protection
  if (config.security.csrf) {
    app.use(csrf.csrfSynchronisedProtection);
  }

  if (config.cache.type === 'redis') {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  }

  if (!isProduction) {
    await seedDatabase(app);
    swagger(app);
  }

  await app.listen(3000);
}

bootstrap();
