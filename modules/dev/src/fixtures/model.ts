/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { ModelCreateDto } from '@/user/dto/model.dto';
import { ModelOrmEntity as ModelEntity } from '@/user/entities/model.entity';

type ModelOrmFixture = ModelCreateDto & { id: string };

export const modelFixtureIds = {
  contentType: '44444444-4444-4444-4444-444444444444',
  content: '55555555-5555-5555-5555-555555555555',
} as const;

export const modelOrmFixtures: ModelOrmFixture[] = [
  {
    id: modelFixtureIds.contentType,
    name: 'ContentType',
    identity: 'contenttype',
    attributes: { att: 'att' },
    relation: 'role',
  },

  {
    id: modelFixtureIds.content,
    name: 'Content',
    identity: 'content',
    attributes: { att: 'att' },
    relation: 'role',
  },
];

export const modelFixtures: ModelCreateDto[] = modelOrmFixtures.map(
  ({ id: _id, ...model }) => model,
);

export const installModelFixturesTypeOrm = async (dataSource: DataSource) => {
  const repository = dataSource.getRepository(ModelEntity);

  if (await repository.count()) {
    return await repository.find();
  }

  const entities = repository.create(modelOrmFixtures);

  return await repository.save(entities);
};
