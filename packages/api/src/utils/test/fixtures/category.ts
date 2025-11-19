/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { DataSource } from 'typeorm';

import { Category, CategoryCreateDto } from '@/chat/dto/category.dto';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { FixturesTypeBuilder } from '../types';

export type TCategoryFixtures = FixturesTypeBuilder<
  Category,
  CategoryCreateDto
>;

export const categoryDefaultValues: TCategoryFixtures['defaultValues'] = {
  builtin: false,
  zoom: 100,
  offset: [0, 0],
};

export const categories: TCategoryFixtures['values'][] = [
  {
    label: 'test category 1',
  },
  {
    label: 'test category 2',
  },
];

export const categoryFixtures = getFixturesWithDefaultValues<
  TCategoryFixtures['values']
>({
  fixtures: categories,
  defaultValues: categoryDefaultValues,
});

const findCategories = async (dataSource: DataSource) =>
  await dataSource
    .getRepository(CategoryOrmEntity)
    .find({ relations: ['blocks'] });

export const installCategoryFixturesTypeOrm = async (
  dataSource: DataSource,
) => {
  const repository = dataSource.getRepository(CategoryOrmEntity);

  if (await repository.count()) {
    return await findCategories(dataSource);
  }

  const entities = categoryFixtures.map((fixture) =>
    repository.create({
      ...fixture,
      builtin: fixture.builtin ?? false,
      zoom: fixture.zoom ?? categoryDefaultValues.zoom ?? 100,
      offset: fixture.offset ?? categoryDefaultValues.offset ?? [0, 0],
    }),
  );

  await repository.save(entities);

  return await findCategories(dataSource);
};
