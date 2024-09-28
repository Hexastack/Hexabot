/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import mongoose from 'mongoose';

import { NlpSampleCreateDto } from '@/nlp/dto/nlp-sample.dto';
import { NlpSampleModel, NlpSample } from '@/nlp/schemas/nlp-sample.schema';
import { NlpSampleState } from '@/nlp/schemas/types';

import { installLanguageFixtures } from './language';
import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixturesDefaultValues } from '../types';

const nlpSamples: NlpSampleCreateDto[] = [
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

export const nlpSampleDefaultValues: TFixturesDefaultValues<NlpSample> = {
  type: NlpSampleState.train,
  trained: false,
};

export const nlpSampleFixtures = getFixturesWithDefaultValues<NlpSample>({
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
        language: languages[parseInt(v.language)].id,
      };
    }),
  );
};
