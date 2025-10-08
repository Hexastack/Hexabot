/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import mongoose from 'mongoose';

import { LabelCreateDto } from '@/chat/dto/label.dto';
import { Label, LabelModel } from '@/chat/schemas/label.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

export type TLabelFixtures = FixturesTypeBuilder<Label, LabelCreateDto>;

export const contentLabelDefaultValues: TLabelFixtures['defaultValues'] = {
  builtin: false,
};

export const labels: TLabelFixtures['values'][] = [
  {
    description: 'test description 1',
    label_id: {
      messenger: 'messenger',
      web: 'web',
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
      web: 'web',
      twitter: 'twitter',
      dimelo: 'dimelo',
    },
    name: 'TEST_TITLE_2',
    title: 'test title 2',
  },
  {
    description: 'test description 3',
    label_id: {
      messenger: 'messenger',
      web: 'web',
      twitter: 'twitter',
      dimelo: 'dimelo',
    },
    name: 'TEST_TITLE_3',
    title: 'test title 3',
  },
];

export const labelFixtures = getFixturesWithDefaultValues<
  TLabelFixtures['values']
>({
  fixtures: labels,
  defaultValues: contentLabelDefaultValues,
});

export const installLabelFixtures = async () => {
  const Label = mongoose.model(LabelModel.name, LabelModel.schema);
  return await Label.insertMany(labelFixtures);
};
