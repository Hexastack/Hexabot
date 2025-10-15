/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { DataSource } from 'typeorm';

let mongod: MongoMemoryServer;
const typeOrmDataSources: DataSource[] = [];

export const rootMongooseTestModule = (
  fixturesFn: (...args: any) => Promise<any>,
  options: MongooseModuleOptions = {},
) =>
  MongooseModule.forRootAsync({
    useFactory: async () => {
      const dbName = 'test';
      mongod = await MongoMemoryServer.create({
        binary: { checkMD5: false },
        instance: { dbName },
      });
      const uri = mongod.getUri();
      await mongoose.connect(`${uri}`);
      await fixturesFn({ uri, dbName });
      return {
        uri,
        ...options,
      };
    },
  });

export const closeInMongodConnection = async () => {
  try {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Unable to close MongoDB connection', err);
  }
};

export const registerTypeOrmDataSource = (dataSource: DataSource) => {
  typeOrmDataSources.push(dataSource);
};

export const closeTypeOrmConnections = async () => {
  await Promise.all(
    typeOrmDataSources.map(async (dataSource) => {
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    }),
  );
  typeOrmDataSources.length = 0;
};

export const getLastTypeOrmDataSource = () =>
  typeOrmDataSources[typeOrmDataSources.length - 1];
