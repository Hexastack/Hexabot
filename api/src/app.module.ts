/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import path from 'path';

// eslint-disable-next-line import/order
import { MailerModule } from '@nestjs-modules/mailer';
// eslint-disable-next-line import/order
import { MjmlAdapter } from '@nestjs-modules/mailer/dist/adapters/mjml.adapter';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { CsrfGuard, CsrfModule } from '@tekuconcept/nestjs-csrf';
import {
  AcceptLanguageResolver,
  I18nOptions,
  QueryResolver,
} from 'nestjs-i18n';
import SMTPTransport from 'nodemailer/lib/smtp-transport';

import { AnalyticsModule } from './analytics/analytics.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AttachmentModule } from './attachment/attachment.module';
import { ChannelModule } from './channel/channel.module';
import { ChatModule } from './chat/chat.module';
import { CmsModule } from './cms/cms.module';
import { config } from './config';
import { HelperModule } from './helper/helper.module';
import { I18nModule } from './i18n/i18n.module';
import { LoggerModule } from './logger/logger.module';
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
    ...(config.emails.isEnabled
      ? [
          MailerModule.forRoot({
            transport: new SMTPTransport({
              ...config.emails.smtp,
              logger: true,
              debug: false,
            }),
            template: {
              adapter: new MjmlAdapter('ejs', { inlineCssEnabled: false }),
              dir: './src/templates',
              options: {
                context: {
                  appName: config.parameters.appName,
                  appUrl: config.parameters.appUrl,
                },
              },
            },
            defaults: { from: config.emails.from },
          }),
        ]
      : []),
    MongooseModule.forRoot(config.mongo.uri, {
      dbName: config.mongo.dbName,
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
    CsrfModule,
    I18nModule.forRoot(i18nOptions),
    CacheModule.register({
      isGlobal: true,
      ttl: config.cache.ttl,
      max: config.cache.max,
    }),
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: Ability },
    { provide: APP_GUARD, useClass: CsrfGuard },
    AppService,
  ],
})
export class AppModule {}
