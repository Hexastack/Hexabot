/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { MetadataCreateDto } from '@/setting/dto/metadata.dto';
import { MetadataOrmEntity } from '@/setting/entities/metadata.entity';

const metadataFixtures: MetadataCreateDto[] = [
  {
    name: 'app-version',
    value: '2.2.0',
  },
];

export const installMetadataFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(MetadataOrmEntity);
  const entities = repository.create(metadataFixtures);
  await repository.save(entities);
};
