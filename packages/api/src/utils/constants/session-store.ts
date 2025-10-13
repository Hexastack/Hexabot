/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import MongoStore from 'connect-mongo';

import { config } from '@/config';

let sessionStore: MongoStore | null = null;

export const getSessionStore = () => {
  if (!sessionStore) {
    sessionStore = MongoStore.create({
      mongoUrl: config.mongo.uri,
      dbName: config.mongo.dbName,
      collectionName: 'sessions',
    });
  }
  return sessionStore;
};
