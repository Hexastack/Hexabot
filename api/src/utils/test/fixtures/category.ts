/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import mongoose from 'mongoose';

import { CategoryCreateDto } from '@/chat/dto/category.dto';
import { CategoryModel, Category } from '@/chat/schemas/category.schema';

import { getFixturesWithDefaultValues } from '../defaultValues';
import { TFixturesDefaultValues } from '../types';

export const categories: CategoryCreateDto[] = [
  {
    label: 'test category 1',
  },
  {
    label: 'test category 2',
  },
];

export const categoryDefaultValues: TFixturesDefaultValues<Category> = {
  builtin: false,
  zoom: 100,
  offset: [0, 0],
};

export const categoryFixtures = getFixturesWithDefaultValues<Category>({
  fixtures: categories,
  defaultValues: categoryDefaultValues,
});

export const installCategoryFixtures = async () => {
  const Category = mongoose.model(CategoryModel.name, CategoryModel.schema);
  return await Category.insertMany(categoryFixtures);
};
