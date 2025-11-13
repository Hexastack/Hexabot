/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource, DeepPartial } from 'typeorm';

import { NlpEntityCreateDto } from '@hexabot/nlp/dto/nlp-entity.dto';
import { NlpEntityOrmEntity } from '@hexabot/nlp/entities/nlp-entity.entity';

export const nlpEntityFixtures: NlpEntityCreateDto[] = [
  {
    name: 'intent',
    lookups: ['trait'],
    doc: '',
    builtin: false,
    weight: 1,
  },
  {
    name: 'firstname',
    lookups: ['keywords'],
    doc: '',
    builtin: false,
    weight: 0.85,
  },
  {
    name: 'built_in',
    lookups: ['trait'],
    doc: '',
    builtin: true,
    weight: 1,
  },
  {
    name: 'subject',
    lookups: ['trait'],
    doc: '',
    builtin: false,
    weight: 0.95,
  },
];

export const nlpEntityOrmFixtures: DeepPartial<NlpEntityOrmEntity>[] =
  nlpEntityFixtures.map((fixture) => ({
    ...fixture,
    foreignId: null,
  }));

export const installNlpEntityFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(NlpEntityOrmEntity);
  const existing = await repository.find();
  if (existing.length) {
    return existing;
  }

  const entities = repository.create(nlpEntityOrmFixtures);

  return await repository.save(entities);
};
