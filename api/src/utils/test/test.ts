/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

export const rootMongooseTestModule = (
  fixturesFn: (...args: any) => Promise<any>,
  options: MongooseModuleOptions = {},
) =>
  MongooseModule.forRootAsync({
    useFactory: async () => {
      const dbName = 'test';
      mongod = await MongoMemoryServer.create({
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
