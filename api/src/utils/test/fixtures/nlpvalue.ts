/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import mongoose from 'mongoose';

import { NlpValueCreateDto } from '@/nlp/dto/nlp-value.dto';
import { NlpValueModel } from '@/nlp/schemas/nlp-value.schema';

import { installNlpEntityFixtures } from './nlpentity';

export const nlpValueFixtures: NlpValueCreateDto[] = [
  {
    entity: '0',
    value: 'positive',
    expressions: [],
    builtin: true,
  },
  {
    entity: '0',
    value: 'negative',
    expressions: [],
    builtin: true,
  },
  {
    entity: '1',
    value: 'jhon',
    expressions: ['john', 'joohn', 'jhonny'],
    builtin: true,
  },
  {
    entity: '0',
    value: 'greeting',
    expressions: ['heello', 'Hello', 'hi', 'heyy'],
    builtin: true,
  },
  {
    entity: '0',
    value: 'goodbye',
    expressions: ['bye', 'bye bye'],
    builtin: true,
  },
];

export const installNlpValueFixtures = async () => {
  const nlpEntities = await installNlpEntityFixtures();

  const NlpValue = mongoose.model(NlpValueModel.name, NlpValueModel.schema);
  const nlpValues = await NlpValue.insertMany(
    nlpValueFixtures.map((v) => {
      return {
        ...v,
        entity: nlpEntities[parseInt(v.entity)].id,
      };
    }),
  );
  return { nlpEntities, nlpValues };
};
