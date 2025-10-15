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

  async updateOne(
    filter: Partial<Metadata>,
    payload: Partial<Metadata>,
  ): Promise<Metadata> {
    const updated = await super.updateOne(
      filter as TFilterQuery<Metadata>,
      payload,
      { upsert: true },
    );

    if (updated) {
      return updated;
    }

    return await this.findOneOrCreate(
      filter as TFilterQuery<Metadata>,
      payload,
    );
  }
}
