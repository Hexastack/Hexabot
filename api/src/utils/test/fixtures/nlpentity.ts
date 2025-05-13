/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
