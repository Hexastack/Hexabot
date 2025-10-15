/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { Metadata } from '../entities/metadata.entity';

@Injectable()
export class MetadataRepository extends BaseOrmRepository<Metadata> {
  constructor(
    @InjectRepository(Metadata)
    repository: Repository<Metadata>,
  ) {
    super(repository);
  }

  async upsert(
    filter: Partial<Metadata>,
    payload: Partial<Metadata>,
  ): Promise<Metadata> {
    const existing =
      (await this.repository.findOne({
        where: filter,
      })) ?? null;

    if (existing) {
      Object.assign(existing, payload);
      return await this.repository.save(existing);
    }

    const entity = this.repository.create({
      ...filter,
      ...payload,
    });
    return await this.repository.save(entity);
  }
}
