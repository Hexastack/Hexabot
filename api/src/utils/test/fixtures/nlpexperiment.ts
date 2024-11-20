/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NlpExperimentCreateDto } from '@/nlp/dto/nlp-experiment.dto';
import { NlpExperimentModel } from '@/nlp/schemas/nlp-experiment.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixturesDefaultValues } from '../types';

// Define the default values for NlpExperiment fixtures
const NlpExperimentDefaultValues: TFixturesDefaultValues<NlpExperimentCreateDto> =
  {
    isCompleted: false,
    duration: 0,
    current_version: 1,
    metadata: {},
    tags: [],
  };

const nlpExperiments: Partial<NlpExperimentCreateDto>[] = [
  {
    foreign_id: 'experiment1',
    run_name: 'Experiment Run 1',
    duration: 3600,
    current_version: 1,
    isCompleted: true,
    tags: ['tag1', 'tag2'],
  },
  {
    foreign_id: 'experiment2',
    run_name: 'Experiment Run 2',
    duration: 1800,
    current_version: 1,
    isCompleted: false,
    tags: ['tag3'],
  },
];

export const NlpExperimentFixtures =
  getFixturesWithDefaultValues<NlpExperimentCreateDto>({
    fixtures: nlpExperiments,
    defaultValues: NlpExperimentDefaultValues,
  });

export const installNlpExperimentFixtures = async () => {
  // Insert the fixtures into the database using the defined NlpExperiment model
  return await NlpExperimentModel.schema.insertMany(
    NlpExperimentFixtures.map((fixture) => ({
      ...fixture,
    })),
  );
};
