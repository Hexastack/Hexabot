/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmService } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { FindOneOptions, FindOptionsWhere } from 'typeorm';

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

  async findOne(
    criteriaOrOptions:
      | string
      | FindOptionsWhere<MetadataOrmEntity>
      | FindOneOptions<MetadataOrmEntity>,
  ): Promise<Metadata | null> {
    return await super.findOne(this.toFindOneOptions(criteriaOrOptions));
  }

  /**
   * @deprecated Use updateOne(options, payload) with TypeORM FindOneOptions instead.
   */
  async updateOne(
    criteria: string | FindOptionsWhere<MetadataOrmEntity>,
    payload: MetadataUpdateDto,
  ): Promise<Metadata>;

  async updateOne(
    options: FindOneOptions<MetadataOrmEntity>,
    payload: MetadataUpdateDto,
  ): Promise<Metadata>;

  async updateOne(
    criteriaOrOptions:
      | string
      | FindOptionsWhere<MetadataOrmEntity>
      | FindOneOptions<MetadataOrmEntity>,
    payload: MetadataUpdateDto,
  ): Promise<Metadata> {
    const normalized = this.toFindOneOptions(criteriaOrOptions);
    const isUpsert =
      typeof criteriaOrOptions !== 'string' &&
      'where' in (criteriaOrOptions as FindOneOptions<MetadataOrmEntity>);

    return await super.updateOne(
      normalized,
      payload,
      isUpsert ? { upsert: true } : undefined,
    );
  }

  private toFindOneOptions(
    criteriaOrOptions:
      | string
      | FindOptionsWhere<MetadataOrmEntity>
      | FindOneOptions<MetadataOrmEntity>,
  ): string | FindOneOptions<MetadataOrmEntity> {
    if (typeof criteriaOrOptions === 'string') {
      return criteriaOrOptions;
    }

    if ('where' in criteriaOrOptions) {
      return criteriaOrOptions as FindOneOptions<MetadataOrmEntity>;
    }

    return {
      where: criteriaOrOptions as FindOptionsWhere<MetadataOrmEntity>,
    };
  }
}
