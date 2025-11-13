/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { config } from '@hexabot/config';
import { Column, ColumnOptions, ColumnType } from 'typeorm';

type JsonColumnOptions = Omit<ColumnOptions, 'type'>;

const dbTypeToJsonColumn: Record<string, ColumnType> = {
  sqlite: 'simple-json',
  postgres: 'json',
  mysql: 'json',
  mariadb: 'json',
};

export const JsonColumn = (
  options: JsonColumnOptions = {},
): PropertyDecorator => {
  const dbType = config.database.type;
  const columnType = dbTypeToJsonColumn[dbType] ?? 'json';

  return Column({
    ...options,
    type: columnType,
  });
};
