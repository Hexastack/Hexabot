/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { Label, LabelModel } from '@/chat/schemas/label.schema';
import { BaseSchema } from '@/utils/generics/base-schema';

import { getFixturesWithDefaultValues } from '../defaultValues';

export const fieldsWithDefaultValues = {
  builtin: false,
} satisfies Partial<Label>;

type TFieldWithDefaultValues =
  | keyof typeof fieldsWithDefaultValues
  | keyof BaseSchema;
type TTransformedField<T> = Omit<T, TFieldWithDefaultValues> &
  Partial<Pick<Label, TFieldWithDefaultValues>>;
type TLabel = TTransformedField<Label>;

export const labels: TLabel[] = [
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
];

export const labelFixtures = getFixturesWithDefaultValues<TLabel>({
  fixtures: labels,
  defaultValues: fieldsWithDefaultValues,
});

export const installLabelFixtures = async () => {
  const Label = mongoose.model(LabelModel.name, LabelModel.schema);
  return await Label.insertMany(labelFixtures);
};
