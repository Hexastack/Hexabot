/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import mongoose from 'mongoose';

import { ContextVarCreateDto } from '@/chat/dto/context-var.dto';
import { ContextVar, ContextVarModel } from '@/chat/schemas/context-var.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

type TContentVarFixtures = FixturesTypeBuilder<ContextVar, ContextVarCreateDto>;

export const contentVarDefaultValues: TContentVarFixtures['defaultValues'] = {
  permanent: false,
};

const contextVars: TContentVarFixtures['values'][] = [
  {
    label: 'Phone',
    name: 'phone',
    permanent: true,
  },
  {
    label: 'Country',
    name: 'country',
    permanent: false,
  },
  {
    label: 'test context var 1',
    name: 'test1',
  },
  {
    label: 'test context var 2',
    name: 'test2',
  },
];

export const contextVarFixtures = getFixturesWithDefaultValues<
  TContentVarFixtures['values']
>({
  fixtures: contextVars,
  defaultValues: contentVarDefaultValues,
});

export const installContextVarFixtures = async () => {
  const ContextVar = mongoose.model(
    ContextVarModel.name,
    ContextVarModel.schema,
  );
  return await ContextVar.insertMany(contextVarFixtures);
};
