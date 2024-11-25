/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { NlpParameterValueCreateDto } from '@/nlp/dto/nlp-parameter-value.dto';
import { NlpParameterValueModel } from '@/nlp/schemas/nlp-parameter-value.schema';

export const nlpParameterValueFixtures: NlpParameterValueCreateDto[] = [
  {
    parameter: 'batch_size',
    version: 0,
    value: 0,
  },
  {
    parameter: 'learning_rate',
    version: 0,
    value: 0.0,
  },
  {
    parameter: 'epochs',
    version: 0,
    value: 0.0,
  },
];

export const installNlpParameterValueFixtures = async () => {
  const NlpParameterValue = mongoose.model(
    NlpParameterValueModel.name,
    NlpParameterValueModel.schema,
  );
  return await NlpParameterValue.insertMany(nlpParameterValueFixtures);
};
