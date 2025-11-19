/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, ColumnOptions, ColumnType } from 'typeorm';

import { config } from '@/config';

type DatetimeColumnOptions = Omit<ColumnOptions, 'type'>;

const datetimeColumnTypeByDb: Record<string, ColumnType> = {
  postgres: 'timestamptz',
  sqlite: 'datetime',
  'better-sqlite3': 'datetime',
  mysql: 'datetime',
  mariadb: 'datetime',
};

export const DatetimeColumn = (
  options: DatetimeColumnOptions = {},
): PropertyDecorator => {
  const dbType = config.database.type;
  const columnType = datetimeColumnTypeByDb[dbType] ?? 'datetime';

  return Column({
    ...options,
    type: columnType,
  });
};
