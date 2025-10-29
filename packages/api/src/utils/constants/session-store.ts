/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TypeormStore } from 'connect-typeorm';
import session from 'express-session';
import { DataSource } from 'typeorm';

import { AppInstance } from '@/app.instance';
import { config } from '@/config';
import { SessionOrmEntity } from '@/session/entities/session.entity';

const toSeconds = (milliseconds: number): number =>
  Math.max(1, Math.floor(milliseconds / 1000));

const logStoreError = (error: Error) => {
  if (config.env === 'test') {
    return;
  }
  // eslint-disable-next-line no-console
  console.error('[session-store] TypeORM store error:', error);
};

const buildTypeormStore = (): session.Store => {
  if (!AppInstance.isReady()) {
    return new session.MemoryStore();
  }

  if (config.database.type === 'mongodb') {
    throw new Error(
      'TypeORM-backed session store is not available for MongoDB',
    );
  }

  const app = AppInstance.getApp();
  const dataSource = app.get(DataSource);

  if (!dataSource.isInitialized) {
    throw new Error('TypeORM data source is not initialized');
  }

  const repository = dataSource.getRepository(SessionOrmEntity);

  return new TypeormStore({
    cleanupLimit: config.session.cleanupLimit,
    limitSubquery: config.session.limitSubquery,
    ttl: config.session.ttlSeconds ?? toSeconds(config.session.cookie.maxAge),
    onError: (_store, error) => logStoreError(error),
  }).connect(repository);
};

let sessionStore: session.Store | null = null;

export const getSessionStore = (): session.Store => {
  if (!sessionStore) {
    try {
      sessionStore = buildTypeormStore();
    } catch (error) {
      if (config.env !== 'test') {
        // eslint-disable-next-line no-console
        console.warn(
          '[session-store] Falling back to in-memory store:',
          error instanceof Error ? error.message : error,
        );
      }
      sessionStore = new session.MemoryStore();
    }
  }

  return sessionStore;
};
