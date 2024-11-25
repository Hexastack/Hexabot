/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { NlpParameterCreateDto } from '@/nlp/dto/nlp-parameter.dto';
import { NlpParameterModel } from '@/nlp/schemas/nlp-parameter.schema';

export const nlpParameterFixtures: NlpParameterCreateDto[] = [
  {
    name: 'batch_size',
  },
  {
    name: 'learning_rate',
  },
  {
    name: 'epochs',
  },
];

export const installNlpParameterFixtures = async () => {
  const NlpParameter = mongoose.model(
    NlpParameterModel.name,
    NlpParameterModel.schema,
  );
  return await NlpParameter.insertMany(nlpParameterFixtures);
};
