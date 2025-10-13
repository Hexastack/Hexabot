/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { NlpSampleCreateDto } from '@/nlp/dto/nlp-sample.dto';
import { NlpSample, NlpSampleModel } from '@/nlp/schemas/nlp-sample.schema';
import { NlpSampleState } from '@/nlp/schemas/types';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

import { installLanguageFixtures } from './language';

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

export const installNlpSampleFixtures = async () => {
  const languages = await installLanguageFixtures();

  const NlpSample = mongoose.model(NlpSampleModel.name, NlpSampleModel.schema);
  return await NlpSample.insertMany(
    nlpSampleFixtures.map((v) => {
      return {
        ...v,
        language: v.language ? languages[parseInt(v.language)].id : null,
      };
    }),
  );
};
