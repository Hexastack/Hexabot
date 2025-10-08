/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { MetadataRepository } from '../repositories/metadata.repository';
import { Metadata } from '../schemas/metadata.schema';

@Injectable()
export class MetadataService extends BaseService<Metadata> {
  constructor(readonly repository: MetadataRepository) {
    super(repository);
  }
}
