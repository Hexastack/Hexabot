/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';
import { TFilterQuery } from '@/utils/types/filter.types';

import { Metadata } from '../entities/metadata.entity';
import { MetadataRepository } from '../repositories/metadata.repository';

@Injectable()
export class MetadataService extends BaseOrmService<
  Metadata,
  MetadataRepository
> {
  constructor(repository: MetadataRepository) {
    super(repository);
  }

  async findOne(filter: Partial<Metadata>): Promise<Metadata | null> {
    return await super.findOne(filter as TFilterQuery<Metadata>);
  }

  async updateOne(
    filter: Partial<Metadata>,
    payload: Partial<Metadata>,
  ): Promise<Metadata> {
    return await this.repository.upsert(filter, payload);
  }
}
