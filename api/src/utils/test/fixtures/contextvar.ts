/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { ContextVar, ContextVarModel } from '@/chat/schemas/context-var.schema';
import { BaseSchema } from '@/utils/generics/base-schema';

import { getFixturesWithDefaultValues } from '../defaultValues';

export const fieldsWithDefaultValues = {
  permanent: false,
} satisfies Partial<ContextVar>;

type TFieldWithDefaultValues =
  | keyof typeof fieldsWithDefaultValues
  | keyof BaseSchema;
type TTransformedField<T> = Omit<T, TFieldWithDefaultValues> &
  Partial<Pick<ContextVar, TFieldWithDefaultValues>>;
type TContextVar = TTransformedField<ContextVar>;

const contextVars: TContextVar[] = [
  {
    label: 'test context var 1',
    name: 'test1',
  },
  {
    label: 'test context var 2',
    name: 'test2',
  },
];

export const contextVarFixtures = getFixturesWithDefaultValues<TContextVar>({
  fixtures: contextVars,
  defaultValues: fieldsWithDefaultValues,
});

export const installContextVarFixtures = async () => {
  const ContextVar = mongoose.model(
    ContextVarModel.name,
    ContextVarModel.schema,
  );
  return await ContextVar.insertMany(contextVarFixtures);
};
