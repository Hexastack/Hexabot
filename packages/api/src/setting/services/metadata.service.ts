/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { FindOneOptions } from 'typeorm';

import { BaseOrmService } from '@/utils/generics/base-orm.service';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  Metadata,
  MetadataDtoConfig,
  MetadataTransformerDto,
  MetadataUpdateDto,
} from '../dto/metadata.dto';
import { MetadataOrmEntity } from '../entities/metadata.entity';
import { MetadataRepository } from '../repositories/metadata.repository';

@Injectable()
export class MetadataService extends BaseOrmService<
  MetadataOrmEntity,
  MetadataTransformerDto,
  MetadataDtoConfig
> {
  constructor(repository: MetadataRepository) {
    super(repository);
  }

  /**
   * @deprecated Use updateOne(options, payload) with TypeORM FindOneOptions instead.
   */
  async updateOne(
    criteria: string | TFilterQuery<MetadataOrmEntity>,
    payload: MetadataUpdateDto,
  ): Promise<Metadata>;

  async updateOne(
    options: FindOneOptions<MetadataOrmEntity>,
    payload: MetadataUpdateDto,
  ): Promise<Metadata>;

  async updateOne(
    criteriaOrOptions:
      | string
      | TFilterQuery<MetadataOrmEntity>
      | FindOneOptions<MetadataOrmEntity>,
    payload: MetadataUpdateDto,
  ): Promise<Metadata> {
    return typeof criteriaOrOptions === 'string' ||
      !this.repository.isFindOptions(criteriaOrOptions)
      ? await super.updateOne(criteriaOrOptions, payload)
      : await super.updateOne(criteriaOrOptions, payload, { upsert: true });
  }
}
