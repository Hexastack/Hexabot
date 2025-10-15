/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { Metadata } from '../entities/metadata.entity';
import { MetadataRepository } from '../repositories/metadata.repository';

@Injectable()
export class MetadataService {
  constructor(private readonly repository: MetadataRepository) {}

  async findOne(filter: Partial<Metadata>): Promise<Metadata | null> {
    return await this.repository.findOne(filter);
  }

  async updateOne(
    filter: Partial<Metadata>,
    payload: Partial<Metadata>,
  ): Promise<Metadata> {
    return await this.repository.upsert(filter, payload);
  }
}
