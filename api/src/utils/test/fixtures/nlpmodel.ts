/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { NlpModelCreateDto } from '@/nlp/dto/nlp-model.dto';
import { NlpModelModel } from '@/nlp/schemas/nlp-model.schema';

export const nlpModelFixtures: NlpModelCreateDto[] = [
  {
    name: 'sentitment-analysis-0',
    version: 0,
    uri: 'mypath-mypath',
    isActive: false,
  },
  {
    name: 'language-classifier-00',
    version: 0,
    uri: 'mypath-mypath-language',
    isActive: false,
  },
  {
    name: 'fraud-detection-000',
    version: 0,
    uri: 'mypath-mypath-fraud',
    isActive: false,
  },
  ,
];

export const installNlpModelFixtures = async () => {
  const NlpModel = mongoose.model(NlpModelModel.name, NlpModelModel.schema);
  return await NlpModel.insertMany(nlpModelFixtures);
};
