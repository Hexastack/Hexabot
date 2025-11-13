/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource, DeepPartial } from 'typeorm';

import { NlpSampleEntityCreateDto } from '@hexabot/nlp/dto/nlp-sample-entity.dto';
import type { NlpEntityOrmEntity } from '@hexabot/nlp/entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '@hexabot/nlp/entities/nlp-sample-entity.entity';
import type { NlpSampleOrmEntity } from '@hexabot/nlp/entities/nlp-sample.entity';
import type { NlpValueOrmEntity } from '@hexabot/nlp/entities/nlp-value.entity';

import { installNlpEntityFixturesTypeOrm } from './nlpentity';
import { installNlpSampleFixturesTypeOrm } from './nlpsample';
import { installNlpValueFixturesTypeOrm, nlpValueFixtures } from './nlpvalue';

export const nlpSampleEntityFixtures: NlpSampleEntityCreateDto[] = [
  {
    sample: '0',
    entity: '0',
    value: '0',
  },
  {
    sample: '1',
    entity: '0',
    value: '1',
  },
  {
    sample: '2',
    entity: '0',
    value: '3',
  },
  {
    sample: '3',
    entity: '0',
    value: '3',
  },
  {
    sample: '3',
    entity: '1',
    value: '4',
  },
];

export const installNlpSampleEntityFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(NlpSampleEntityOrmEntity);
  const entities = await installNlpEntityFixturesTypeOrm(dataSource);
  const [samples, values] = await Promise.all([
    installNlpSampleFixturesTypeOrm(dataSource),
    installNlpValueFixturesTypeOrm(dataSource),
  ]);
  const valueMap = values.reduce<Record<string, NlpValueOrmEntity>>(
    (acc, value) => {
      acc[value.value] = value;

      return acc;
    },
    {},
  );
  const sampleRecords: Record<number, NlpSampleOrmEntity> = {};
  samples.forEach((sample, index) => (sampleRecords[index] = sample));

  const entityRecords: Record<number, NlpEntityOrmEntity> = {};
  entities.forEach((entity, index) => (entityRecords[index] = entity));

  const existing = await repository.find();
  if (existing.length) {
    return existing;
  }

  const records: DeepPartial<NlpSampleEntityOrmEntity>[] =
    nlpSampleEntityFixtures.map((fixture) => {
      const sample = sampleRecords[parseInt(fixture.sample, 10)];
      const entity = entityRecords[parseInt(fixture.entity, 10)];
      const valueFixture = nlpValueFixtures[parseInt(fixture.value, 10)];
      const value = valueFixture ? valueMap[valueFixture.value] : undefined;

      if (!sample || !entity || !value) {
        throw new Error(
          `Unable to resolve sample entity fixture dependencies (sample=${sample?.id ?? 'undefined'}, entity=${entity?.id ?? 'undefined'}, value=${valueFixture?.value ?? 'undefined'})`,
        );
      }

      return {
        sample: { id: sample.id },
        entity: { id: entity.id },
        value: { id: value.id },
        start: fixture.start ?? null,
        end: fixture.end ?? null,
      };
    });
  const created = repository.create(records);

  return await repository.save(created);
};
