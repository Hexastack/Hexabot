/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
