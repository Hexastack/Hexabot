/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { MetadataCreateDto } from '../dto/metadata.dto';
import { MetadataRepository } from '../repositories/metadata.repository';

@Injectable()
export class MetadataSeeder {
  constructor(private readonly metadataRepository: MetadataRepository) {}

  async seed(models: MetadataCreateDto[]): Promise<boolean> {
    for (const model of models) {
      await this.metadataRepository.upsert(
        { name: model.name },
        { value: model.value },
      );
    }

    return true;
  }
}
