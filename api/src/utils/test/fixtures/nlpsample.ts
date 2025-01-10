/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { NlpSample, NlpSampleModel } from '@/nlp/schemas/nlp-sample.schema';
import { NlpSampleState } from '@/nlp/schemas/types';
import { BaseSchema } from '@/utils/generics/base-schema';

import { getFixturesWithDefaultValues } from '../defaultValues';

import { installLanguageFixtures } from './language';

export const fieldsWithDefaultValues = {
  type: NlpSampleState.train,
  trained: false,
} satisfies Partial<NlpSample>;

type TFieldWithDefaultValues =
  | keyof typeof fieldsWithDefaultValues
  | keyof BaseSchema;
type TTransformedField<T> = Omit<T, TFieldWithDefaultValues> &
  Partial<Pick<NlpSample, TFieldWithDefaultValues>>;
type TNlpSample = TTransformedField<NlpSample>;

const nlpSamples: TNlpSample[] = [
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

export const nlpSampleFixtures = getFixturesWithDefaultValues<TNlpSample>({
  fixtures: nlpSamples,
  defaultValues: fieldsWithDefaultValues,
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
