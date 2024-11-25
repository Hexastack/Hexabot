/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { NlpExperimentCreateDto } from '@/nlp/dto/nlp-experiment.dto';
import { NlpExperimentModel } from '@/nlp/schemas/nlp-experiment.schema';

export const nlpExperimentFixtures: NlpExperimentCreateDto[] = [
  {
    run_name: 'my_run_sentiment_analysis_01',
    current_version: 1,
    model: 'sentiment_analysis',
  },
  {
    run_name: 'my_run_language_classifier_01',
    current_version: 1,
    model: 'language_classifier',
  },
  {
    run_name: 'my_run_fraud_detection_01',
    current_version: 1,
    model: 'fraud_detection',
  },
];

export const installNlpExperimentFixtures = async () => {
  const NlpExperiment = mongoose.model(
    NlpExperimentModel.name,
    NlpExperimentModel.schema,
  );
  return await NlpExperiment.insertMany(nlpExperimentFixtures);
};
