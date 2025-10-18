/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import { MetadataCreateDto } from '../dto/metadata.dto';
import { MetadataOrmEntity } from '../entities/metadata.entity';
import { MetadataRepository } from '../repositories/metadata.repository';

@Injectable()
export class MetadataSeeder extends BaseOrmSeeder<
  MetadataOrmEntity,
  MetadataRepository
> {
  constructor(repository: MetadataRepository) {
    super(repository);
  }

  async seed(models: MetadataCreateDto[]): Promise<boolean> {
    for (const model of models) {
      await this.repository.updateOne(
        { name: model.name },
        { value: model.value },
        { upsert: true },
      );
    }

    return true;
  }
}
