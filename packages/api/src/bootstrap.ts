/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import 'dotenv/config';

import { Type, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import bodyParser from 'body-parser';
import moduleAlias from 'module-alias';
import { resolveDynamicProviders } from 'nestjs-dynamic-providers';
import passport from 'passport';

import { AppInstance } from './app.instance';
import { config } from './config';
import { csrf } from './config/csrf';
import { seedDatabase } from './seeder';
import { SettingService } from './setting/services/setting.service';
import { swagger } from './swagger';
import { getSessionMiddleware } from './utils/constants/session-middleware';
import { UuidPipe } from './utils/pipes/uuid.pipe';
import { RedisIoAdapter } from './websocket/adapters/redis-io.adapter';

moduleAlias.addAliases({
  '@': __dirname,
});

const rawBodyBuffer = (req, res, buf, encoding) => {
  if (buf?.length) {
    req.rawBody = buf.toString(encoding || 'utf8');
  }
};
const isProductionEnv = (forced?: boolean): boolean => {
  if (typeof forced === 'boolean') {
    return forced;
  }

  return config.env.toLowerCase().includes('prod');
};

export interface HexabotBootstrapOptions {
  listen?: {
    port?: number | string;
    host?: string;
  };
  production?: boolean;
  skipSeed?: boolean;
  skipSwagger?: boolean;
}

export async function createHexabotApplication<
  TApp extends NestExpressApplication = NestExpressApplication,
>(moduleRef: Type<unknown>): Promise<TApp> {
  await resolveDynamicProviders();
  const app = await NestFactory.create<TApp>(moduleRef, {
    bodyParser: false,
  });

  app.set('query parser', 'extended');

  AppInstance.setApp(app);

  if (config.mode === 'monolith') {
    app.setGlobalPrefix(config.apiPrefix);
  }

  app.getHttpAdapter().getInstance().disable('x-powered-by');

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

  if (config.security.csrf) {
    app.use(csrf.csrfSynchronisedProtection);
  }

  if (config.cache.type === 'redis') {
    const redisIoAdapter = new RedisIoAdapter(app);
    await redisIoAdapter.connectToRedis();
    app.useWebSocketAdapter(redisIoAdapter);
  }

  return app;
}

export async function bootstrapHexabotApp(
  moduleRef: Type<unknown>,
  options: HexabotBootstrapOptions = {},
): Promise<NestExpressApplication> {
  const app = await createHexabotApplication(moduleRef);
  const production = isProductionEnv(options.production);

  if (!production && !options.skipSeed) {
    await seedDatabase(app);
  }

  if (!production && !options.skipSwagger) {
    swagger(app);
  }

  const port =
    options.listen?.port ??
    (Number.parseInt(`${process.env.PORT ?? ''}`, 10) || 3000);
  const host = options.listen?.host ?? '0.0.0.0';

  await app.listen(port, host);

  return app;
}
