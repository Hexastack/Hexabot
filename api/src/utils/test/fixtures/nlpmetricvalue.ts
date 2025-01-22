/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { NlpMetricValueCreateDto } from '@/nlp/dto/nlp-metric-value.dto';
import { NlpMetricValueModel } from '@/nlp/schemas/nlp-metric-value.schema';

export const nlpMetricValueFixtures: NlpMetricValueCreateDto[] = [
  {
    metric: 'accuracy',
    version: 0,
    value: 0.0,
  },
  {
    metric: 'recall',
    version: 0,
    value: 0.0,
  },
  ,
  {
    metric: 'precision',
    version: 0,
    value: 0.0,
  },
];

export const installNlpMetricValueFixtures = async () => {
  const NlpMetricValue = mongoose.model(
    NlpMetricValueModel.name,
    NlpMetricValueModel.schema,
  );
  return await NlpMetricValue.insertMany(nlpMetricValueFixtures);
};
