/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
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
