/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import mongoose from 'mongoose';

import { ModelCreateDto } from '@/user/dto/model.dto';
import { ModelModel } from '@/user/schemas/model.schema';

export const modelFixtures: ModelCreateDto[] = [
  {
    name: 'ContentType',
    identity: 'contenttype',
    attributes: { att: 'att' },
    relation: 'role',
  },

  {
    name: 'Content',
    identity: 'content',
    attributes: { att: 'att' },
    relation: 'role',
  },
];

export const installModelFixtures = async () => {
  const Model = mongoose.model(ModelModel.name, ModelModel.schema);
  return await Model.insertMany(modelFixtures);
};
