/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { existsSync } from 'fs';
import path, { join } from 'path';

import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module, ModuleMetadata } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheableMemory } from 'cacheable';
import { Keyv } from 'keyv';
import {
  AcceptLanguageResolver,
  I18nOptions,
  QueryResolver,
} from 'nestjs-i18n';

import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttachmentModule } from './attachment/attachment.module';
import { ChannelModule } from './channel/channel.module';
import { ChatModule } from './chat/chat.module';
import { CmsModule } from './cms/cms.module';
import { config } from './config';
import { TypeormConfigService } from './database/typeorm-config.service';
import { ExtensionModule } from './extension/extension.module';
import extraModules from './extra';
import { HelperModule } from './helper/helper.module';
import { I18nModule } from './i18n/i18n.module';
import { LoggerModule } from './logger/logger.module';
import { MailerModule } from './mailer/mailer.module';
import { MigrationModule } from './migration/migration.module';
import { NlpModule } from './nlp/nlp.module';
import { PluginsModule } from './plugins/plugins.module';
import { SettingModule } from './setting/setting.module';
import { Ability } from './user/guards/ability.guard';
import { UserModule } from './user/user.module';
import { WebsocketModule } from './websocket/websocket.module';

const compiledFrontendPath = join(__dirname, 'frontend');
const workspaceFrontendPath = join(__dirname, '..', '..', 'frontend', 'dist');
const frontendRootPath = existsSync(compiledFrontendPath)
  ? compiledFrontendPath
  : workspaceFrontendPath;
const i18nOptions: I18nOptions = {
  fallbackLanguage: 'en',
  loaderOptions: {
    path: path.join(__dirname, '/config/i18n/'),
    watch: true,
  },
  resolvers: [
    { use: QueryResolver, options: ['lang'] },
    AcceptLanguageResolver,
  ],
};

type ModuleImports = NonNullable<ModuleMetadata['imports']>;
type ModuleControllers = NonNullable<ModuleMetadata['controllers']>;
type ModuleProviders = NonNullable<ModuleMetadata['providers']>;

export const HEXABOT_MODULE_IMPORTS: ModuleImports = [
  ...(config.mode === 'monolith'
    ? [
        ServeStaticModule.forRoot({
          rootPath: frontendRootPath,
        }),
      ]
    : []),
  MailerModule,
  NlpModule,
  CmsModule,
  UserModule,
  SettingModule,
  AttachmentModule,
  AnalyticsModule,
  ChatModule,
  ChannelModule,
  PluginsModule,
  HelperModule,
  LoggerModule,
  WebsocketModule,
  EventEmitterModule.forRoot({
    global: true,
    // set this to `true` to use wildcards
    wildcard: true,
    // the delimiter used to segment namespaces
    delimiter: ':',
    // set this to `true` if you want to emit the newListener event
    newListener: false,
    // set this to `true` if you want to emit the removeListener event
    removeListener: false,
    // the maximum amount of listeners that can be assigned to an event
    maxListeners: 10,
    // show event name in memory leak message when more than maximum amount of listeners is assigned
    verboseMemoryLeak: false,
    // disable throwing uncaughtException if an error event is emitted and it has no listeners
    ignoreErrors: false,
  }),
  I18nModule.forRoot(i18nOptions),
  CacheModule.registerAsync({
    isGlobal: true,
    useFactory: async () => ({
      // first store is primary, subsequent stores are secondary/fallback
      stores: [
        config.cache.type === 'redis'
          ? new KeyvRedis(
              `${config.cache.protocol}//${config.cache.user}:${config.cache.password}@${config.cache.host}:${config.cache.port}`,
            )
          : new Keyv({
              store: new CacheableMemory({
                ttl: config.cache.ttl,
                lruSize: config.cache.max,
              }),
            }),
      ],
    }),
  }),
  TypeOrmModule.forRootAsync({
    useClass: TypeormConfigService,
  }),
  MigrationModule,
  ExtensionModule,
  ...extraModules,
];

export const HEXABOT_MODULE_CONTROLLERS: ModuleControllers = [AppController];

export const HEXABOT_MODULE_PROVIDERS: ModuleProviders = [
  { provide: APP_GUARD, useClass: Ability },
  TypeormConfigService,
  AppService,
];

@Module({
  imports: HEXABOT_MODULE_IMPORTS,
  controllers: HEXABOT_MODULE_CONTROLLERS,
  providers: HEXABOT_MODULE_PROVIDERS,
})
export class HexabotModule {}
