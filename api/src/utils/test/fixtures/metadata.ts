/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import mongoose from 'mongoose';

import { MetadataCreateDto } from '@/setting/dto/metadata.dto';
import { MetadataModel } from '@/setting/schemas/metadata.schema';

const metadataFixtures: MetadataCreateDto[] = [
  {
    name: 'app-version',
    value: '2.2.0',
  },
];

export const installMetadataFixtures = async () => {
  const Metadata = mongoose.model(MetadataModel.name, MetadataModel.schema);
  return await Metadata.insertMany(metadataFixtures);
};
