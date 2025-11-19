/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Metadata,
  MetadataDtoConfig,
  MetadataTransformerDto,
} from '../dto/metadata.dto';
import { MetadataOrmEntity } from '../entities/metadata.entity';

@Injectable()
export class MetadataRepository extends BaseOrmRepository<
  MetadataOrmEntity,
  MetadataTransformerDto,
  MetadataDtoConfig
> {
  constructor(
    @InjectRepository(MetadataOrmEntity)
    repository: Repository<MetadataOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: Metadata,
      FullCls: Metadata,
    });
  }
}
