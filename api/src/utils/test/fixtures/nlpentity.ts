/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { NlpEntityCreateDto } from '@/nlp/dto/nlp-entity.dto';
import { NlpEntityModel } from '@/nlp/schemas/nlp-entity.schema';

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

export const installNlpEntityFixtures = async () => {
  const NlpEntity = mongoose.model(NlpEntityModel.name, NlpEntityModel.schema);
  return await NlpEntity.insertMany(nlpEntityFixtures);
};
