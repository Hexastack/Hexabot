/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { LabelGroupCreateDto } from '@/chat/dto/label-group.dto';
import { LabelGroup, LabelGroupModel } from '@/chat/schemas/label-group.schema';
import { LabelModel } from '@/chat/schemas/label.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

import { contentLabelDefaultValues, TLabelFixtures } from './label';

type TLabelGroupFixtures = FixturesTypeBuilder<LabelGroup, LabelGroupCreateDto>;

export const labelGroupFixtures: TLabelGroupFixtures['values'][] = [
  {
    name: 'Subscription',
  },
];

export const labels: TLabelFixtures['values'][] = [
  {
    name: 'FREE',
    title: 'Free',
  },
  {
    name: 'STANDARD',
    title: 'Standard',
  },
  {
    name: 'PREMIUM',
    title: 'Premium',
  },
];

export const groupedLabelFixtures = getFixturesWithDefaultValues<
  TLabelFixtures['values']
>({
  fixtures: labels,
  defaultValues: contentLabelDefaultValues,
});

export const installLabelGroupFixtures = async () => {
  const LabelGroup = mongoose.model(
    LabelGroupModel.name,
    LabelGroupModel.schema,
  );
  const [labelGroup] = await LabelGroup.insertMany(labelGroupFixtures);

  const Label = mongoose.model(LabelModel.name, LabelModel.schema);
  return await Label.insertMany(
    groupedLabelFixtures.map((label) => ({ ...label, group: labelGroup.id })),
  );
};
