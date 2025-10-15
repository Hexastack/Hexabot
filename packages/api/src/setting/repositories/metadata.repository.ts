/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Metadata } from '../entities/metadata.entity';

@Injectable()
export class MetadataRepository {
  constructor(
    @InjectRepository(Metadata)
    private readonly repository: Repository<Metadata>,
  ) {}

  async findOne(filter: Partial<Metadata>): Promise<Metadata | null> {
    return (
      (await this.repository.findOne({
        where: filter,
      })) ?? null
    );
  }

  async upsert(
    filter: Partial<Metadata>,
    payload: Partial<Metadata>,
  ): Promise<Metadata> {
    const existing = await this.findOne(filter);
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
