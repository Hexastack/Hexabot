/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource, DeepPartial } from 'typeorm';

import { NlpValueCreateDto } from '@hexabot/nlp/dto/nlp-value.dto';
import { NlpEntityOrmEntity } from '@hexabot/nlp/entities/nlp-entity.entity';
import { NlpValueOrmEntity } from '@hexabot/nlp/entities/nlp-value.entity';

import {
  installNlpEntityFixturesTypeOrm,
  nlpEntityFixtures,
} from './nlpentity';

export const nlpValueFixtures: NlpValueCreateDto[] = [
  {
    entity: '0',
    value: 'positive',
    expressions: [],
    builtin: false,
    doc: '',
  },
  {
    entity: '0',
    value: 'negative',
    expressions: [],
    builtin: false,
    doc: '',
  },
  {
    entity: '1',
    value: 'jhon',
    expressions: ['john', 'joohn', 'jhonny'],
    builtin: false,
    doc: '',
  },
  {
    entity: '0',
    value: 'greeting',
    expressions: ['heello', 'Hello', 'hi', 'heyy'],
    builtin: false,
    doc: '',
  },
  {
    entity: '0',
    value: 'goodbye',
    expressions: ['bye', 'bye bye'],
    builtin: false,
    doc: '',
  },
  {
    entity: '0',
    value: 'affirmation',
    expressions: ['yes', 'oui', 'yeah'],
    builtin: false,
    doc: '',
  },
  {
    entity: '3',
    value: 'product',
    expressions: [],
    builtin: false,
    doc: '',
  },
  {
    entity: '3',
    value: 'claim',
    expressions: [],
    builtin: false,
    doc: '',
  },
];

export const installNlpValueFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const nlpEntities = await installNlpEntityFixturesTypeOrm(dataSource);
  const repository = dataSource.getRepository(NlpValueOrmEntity);
  const existing = await repository.find();
  if (existing.length) {
    return existing;
  }

  const entitiesByName = nlpEntities.reduce<Record<string, NlpEntityOrmEntity>>(
    (acc, entity) => {
      acc[entity.name] = entity;

      return acc;
    },
    {},
  );
  const values: DeepPartial<NlpValueOrmEntity>[] = nlpValueFixtures.map(
    (fixture) => {
      const entityIndex = parseInt(fixture.entity, 10);
      const entityName = nlpEntityFixtures[entityIndex]?.name;
      const entity = entityName ? entitiesByName[entityName] : undefined;

      if (!entity) {
        throw new Error(`Unable to resolve entity for value ${fixture.value}`);
      }

      return {
        ...fixture,
        entity: { id: entity.id },
        foreignId: null,
      };
    },
  );
  const records = repository.create(values);

  return await repository.save(records);
};
