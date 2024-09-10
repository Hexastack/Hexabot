/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import mongoose from 'mongoose';

import { LabelCreateDto } from '@/chat/dto/label.dto';
import { LabelModel, Label } from '@/chat/schemas/label.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixturesDefaultValues } from '../types';

export const labels: LabelCreateDto[] = [
  {
    description: 'test description 1',
    label_id: {
      messenger: 'messenger',
      offline: 'offline',
      twitter: 'twitter',
      dimelo: 'dimelo',
    },
    name: 'TEST_TITLE_1',
    title: 'test title 1',
  },
  {
    description: 'test description 2',
    label_id: {
      messenger: 'messenger',
      offline: 'offline',
      twitter: 'twitter',
      dimelo: 'dimelo',
    },
    name: 'TEST_TITLE_2',
    title: 'test title 2',
  },
];

export const labelDefaultValues: TFixturesDefaultValues<Label> = {
  builtin: false,
};

export const labelFixtures = getFixturesWithDefaultValues<Label>({
  fixtures: labels,
  defaultValues: labelDefaultValues,
});

export const installLabelFixtures = async () => {
  const Label = mongoose.model(LabelModel.name, LabelModel.schema);
  return await Label.insertMany(labelFixtures);
};
