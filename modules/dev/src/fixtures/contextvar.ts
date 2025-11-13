/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { ContextVar, ContextVarCreateDto } from '@/chat/dto/context-var.dto';
import { ContextVarOrmEntity } from '@/chat/entities/context-var.entity';

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

export const installContextVarFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(ContextVarOrmEntity);

  if (await repository.count()) {
    return await repository.find();
  }

  const entities = contextVarFixtures.map((fixture) =>
    repository.create({
      ...fixture,
      permanent: fixture.permanent ?? false,
    }),
  );

  return await repository.save(entities);
};
