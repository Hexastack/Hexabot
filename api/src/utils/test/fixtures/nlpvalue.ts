/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { NlpValueCreateDto } from '@/nlp/dto/nlp-value.dto';
import { NlpValueModel } from '@/nlp/schemas/nlp-value.schema';

import { installNlpEntityFixtures, nlpEntityFixtures } from './nlpentity';

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

export const installNlpValueFixtures = async () => {
  const nlpEntities = await installNlpEntityFixtures();

  const NlpValue = mongoose.model(NlpValueModel.name, NlpValueModel.schema);

  const nlpValues = await NlpValue.insertMany(
    nlpValueFixtures.map((v) => ({
      ...v,
      entity: v?.entity
        ? nlpEntities.find(
            (e) =>
              e.name === nlpEntityFixtures[parseInt(v.entity as string)].name,
          ).id
        : null,
    })),
  );
  return { nlpEntities, nlpValues };
};
