/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';

import { BaseSeeder } from '@/utils/generics/base-seeder';

import { MetadataRepository } from '../repositories/metadata.repository';
import { Metadata } from '../schemas/metadata.schema';

@Injectable()
export class MetadataSeeder extends BaseSeeder<Metadata> {
  constructor(private readonly metadataRepository: MetadataRepository) {
    super(metadataRepository);
  }
}
