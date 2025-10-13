/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import mongoose from 'mongoose';

import { DummyCreateDto } from '@/utils/test/dummy/dto/dummy.dto';
import { DummyModel } from '@/utils/test/dummy/schemas/dummy.schema';

export const dummyFixtures: DummyCreateDto[] = [
  {
    dummy: 'dummy test 1',
  },
  {
    dummy: 'dummy test 2',
  },
  {
    dummy: 'dummy test 3',
  },
  {
    dummy: 'dummy test 4',
  },
];

export const installDummyFixtures = async () => {
  const Dummy = mongoose.model(DummyModel.name, DummyModel.schema);
  return await Dummy.insertMany(dummyFixtures);
};
