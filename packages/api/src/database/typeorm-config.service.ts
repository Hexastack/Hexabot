/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

import { config } from '@/config';

@Injectable()
export class TypeormConfigService implements TypeOrmOptionsFactory {
  createTypeOrmOptions(): TypeOrmModuleOptions {
    const db = config.database;
    const base: TypeOrmModuleOptions = {
      type: db.type,
      synchronize: db.synchronize,
      logging: db.logging,
      autoLoadEntities: true,
    } as TypeOrmModuleOptions;

    switch (db.type) {
      case 'postgres':
        // @ts-expect-error type mismatch
        return {
          ...base,
          type: 'postgres',
          url: db.url,
          host: db.url ? undefined : db.host,
          port: db.url ? undefined : (db.port ?? 5432),
          username: db.url ? undefined : db.username,
          password: db.url ? undefined : db.password,
          database: db.url ? undefined : db.database,
          schema: db.schema,
        };
      case 'mongodb':
        return {
          ...base,
          type: 'mongodb',
          url: db.url ?? config.mongo.uri,
          database: db.database ?? config.mongo.dbName,
          // useUnifiedTopology: true,
        } as TypeOrmModuleOptions;
      case 'sqlite':
      default:
        console.log('====', {
          ...base,
          type: 'sqlite',
          database: db.sqlitePath ?? 'hexabot.sqlite',
        });
        // @ts-expect-error type mismatch)
        return {
          ...base,
          type: 'sqlite',
          database: db.sqlitePath ?? 'hexabot.sqlite',
        };
    }
  }
}
