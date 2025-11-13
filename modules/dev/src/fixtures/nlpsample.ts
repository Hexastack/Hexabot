/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource, DeepPartial } from 'typeorm';

import { LanguageOrmEntity } from '@hexabot/i18n/entities/language.entity';
import { NlpSample, NlpSampleCreateDto } from '@hexabot/nlp/dto/nlp-sample.dto';
import { NlpSampleOrmEntity } from '@hexabot/nlp/entities/nlp-sample.entity';
import { NlpSampleState } from '@hexabot/nlp/types';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

import { installLanguageFixturesTypeOrm } from './language';

type TNlpSampleFixtures = FixturesTypeBuilder<NlpSample, NlpSampleCreateDto>;

export const nlpSampleDefaultValues: TNlpSampleFixtures['defaultValues'] = {
  type: NlpSampleState.train,
  trained: false,
};

const nlpSamples: TNlpSampleFixtures['values'][] = [
  {
    text: 'yess',
    language: '0',
  },
  {
    text: 'No',
    language: '0',
  },
  {
    text: 'Hello',
    trained: true,
    language: '0',
  },
  {
    text: 'Bye Jhon',
    trained: true,
    language: '0',
  },
];

export const nlpSampleFixtures = getFixturesWithDefaultValues<
  TNlpSampleFixtures['values']
>({
  fixtures: nlpSamples,
  defaultValues: nlpSampleDefaultValues,
});

export const installNlpSampleFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const languageRepository = dataSource.getRepository(LanguageOrmEntity);
  let languages = await languageRepository.find();
  if (!languages.length) {
    languages = await installLanguageFixturesTypeOrm(dataSource);
  }

  const repository = dataSource.getRepository(NlpSampleOrmEntity);
  const existing = await repository.find();
  if (existing.length) {
    return existing;
  }

  const samples: DeepPartial<NlpSampleOrmEntity>[] = nlpSampleFixtures.map(
    (fixture) => {
      const languageIndex =
        typeof fixture.language === 'number'
          ? fixture.language
          : parseInt(String(fixture.language), 10);
      const language =
        Number.isNaN(languageIndex) || !languages[languageIndex]
          ? null
          : languages[languageIndex];

      return {
        text: fixture.text,
        trained: fixture.trained ?? false,
        type: (fixture.type ?? NlpSampleState.train) as NlpSampleState,
        language: language ? { id: language?.id } : null,
      };
    },
  );
  const records = repository.create(samples);

  return await repository.save(records);
};
