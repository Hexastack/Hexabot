/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { config } from '@hexabot/config';
import { Column, ColumnOptions, ColumnType } from 'typeorm';

type EnumColumnOptions = Omit<ColumnOptions, 'type'>;

const dbTypeToEnumColumn: Record<string, ColumnType> = {
  sqlite: 'simple-enum',
  'better-sqlite3': 'simple-enum',
  postgres: 'enum',
  mysql: 'enum',
  mariadb: 'enum',
};

export const EnumColumn = (options: EnumColumnOptions): PropertyDecorator => {
  if (!options?.enum) {
    throw new Error('EnumColumn requires the enum option to be provided.');
  }

  const dbType = config.database.type;
  const columnType = dbTypeToEnumColumn[dbType] ?? 'enum';

  return Column({
    ...options,
    type: columnType,
  });
};
