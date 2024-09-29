/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
