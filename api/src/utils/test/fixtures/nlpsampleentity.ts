/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { NlpSampleEntityCreateDto } from '@/nlp/dto/nlp-sample-entity.dto';
import { NlpSampleEntityModel } from '@/nlp/schemas/nlp-sample-entity.schema';

import { installNlpSampleFixtures } from './nlpsample';
import { installNlpValueFixtures } from './nlpvalue';

export const nlpSampleEntityFixtures: NlpSampleEntityCreateDto[] = [
  {
    sample: '0',
    entity: '0',
    value: '0',
  },
  {
    sample: '1',
    entity: '0',
    value: '1',
  },
  {
    sample: '2',
    entity: '0',
    value: '3',
  },
  {
    sample: '3',
    entity: '0',
    value: '3',
  },
  {
    sample: '3',
    entity: '1',
    value: '4',
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
        sample: nlpSamples[parseInt(s.sample)].id,
        entity: nlpEntities[parseInt(s.entity)].id,
        value: nlpValues[parseInt(s.value)].id,
      };
    }),
  );
};
