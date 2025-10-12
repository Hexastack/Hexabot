/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import path from 'path';

import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
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
import idPlugin from './utils/schema-plugin/id.plugin';
import { WebsocketModule } from './websocket/websocket.module';

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

@Module({
  imports: [
    MailerModule,
    MongooseModule.forRoot(config.mongo.uri, {
      dbName: config.mongo.dbName,
      autoIndex: config.env !== 'production', // Disable in production
      connectionFactory: (connection) => {
        connection.plugin(idPlugin);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        connection.plugin(require('mongoose-lean-virtuals'));
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        connection.plugin(require('mongoose-lean-getters'));
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        connection.plugin(require('mongoose-lean-defaults').default);
        return connection;
      },
    }),
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
            ? new KeyvRedis(`${config.cache.host}:${config.cache.port}`)
            : new Keyv({
                store: new CacheableMemory({
                  ttl: config.cache.ttl,
                  lruSize: config.cache.max,
                }),
              }),
        ],
      }),
    }),
    MigrationModule,
    ExtensionModule,
    ...extraModules,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: Ability }, AppService],
})
export class HexabotModule {}
