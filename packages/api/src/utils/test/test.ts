/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

const typeOrmDataSources: DataSource[] = [];

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
