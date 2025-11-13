/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MetadataCreateDto } from '@hexabot/setting/dto/metadata.dto';
import { MetadataOrmEntity } from '@hexabot/setting/entities/metadata.entity';
import { DataSource } from 'typeorm';

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
