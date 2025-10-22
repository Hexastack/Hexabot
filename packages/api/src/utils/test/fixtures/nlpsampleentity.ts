/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';
import { DataSource, DeepPartial } from 'typeorm';

import { NlpSampleEntityCreateDto } from '@/nlp/dto/nlp-sample-entity.dto';
import type { NlpEntityOrmEntity } from '@/nlp/entities/nlp-entity.entity';
import { NlpSampleEntityOrmEntity } from '@/nlp/entities/nlp-sample-entity.entity';
import type { NlpSampleOrmEntity } from '@/nlp/entities/nlp-sample.entity';
import type { NlpValueOrmEntity } from '@/nlp/entities/nlp-value.entity';
import { NlpSampleEntityModel } from '@/nlp/schemas/nlp-sample-entity.schema';

import { installNlpEntityFixturesTypeOrm } from './nlpentity';
import {
  installNlpSampleFixtures,
  installNlpSampleFixturesTypeOrm,
} from './nlpsample';
import {
  installNlpValueFixtures,
  installNlpValueFixturesTypeOrm,
  nlpValueFixtures,
} from './nlpvalue';

export const nlpSampleEntityFixtures: NlpSampleEntityCreateDto[] = [
  {
    sampleId: '0',
    entityId: '0',
    valueId: '0',
  },
  {
    sampleId: '1',
    entityId: '0',
    valueId: '1',
  },
  {
    sampleId: '2',
    entityId: '0',
    valueId: '3',
  },
  {
    sampleId: '3',
    entityId: '0',
    valueId: '3',
  },
  {
    sampleId: '3',
    entityId: '1',
    valueId: '4',
  },
];

export const installNlpSampleEntityFixtures = async () => {
  const { nlpValues, nlpEntities } = await installNlpValueFixtures();
  const nlpSamples = await installNlpSampleFixtures();

  const NlpSampleEntity = mongoose.model(
    NlpSampleEntityModel.name,
    NlpSampleEntityModel.schema,
  );
  return await NlpSampleEntity.insertMany(
    nlpSampleEntityFixtures.map((s) => {
      return {
        ...s,
        sample: nlpSamples[parseInt(s.sampleId)].id,
        entity: nlpEntities[parseInt(s.entityId)].id,
        value: nlpValues[parseInt(s.valueId)].id,
      };
    }),
  );
};

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
      const sample = sampleRecords[parseInt(fixture.sampleId, 10)];
      const entity = entityRecords[parseInt(fixture.entityId, 10)];
      const valueFixture = nlpValueFixtures[parseInt(fixture.valueId, 10)];
      const value = valueFixture ? valueMap[valueFixture.value] : undefined;

      if (!sample || !entity || !value) {
        throw new Error(
          `Unable to resolve sample entity fixture dependencies (sample=${sample?.id ?? 'undefined'}, entity=${entity?.id ?? 'undefined'}, value=${valueFixture?.value ?? 'undefined'})`,
        );
      }

      return {
        sampleId: sample.id,
        entityId: entity.id,
        valueId: value.id,
        start: fixture.start ?? null,
        end: fixture.end ?? null,
      };
    });

  const created = repository.create(records);
  return await repository.save(created);
};
