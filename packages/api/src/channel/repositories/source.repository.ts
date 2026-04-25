/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { SourceOrmEntity } from '../entities/source.entity';

@Injectable()
export class SourceRepository extends BaseOrmRepository<SourceOrmEntity> {
  constructor(
    @InjectRepository(SourceOrmEntity)
    repository: Repository<SourceOrmEntity>,
  ) {
    super(repository, ['defaultWorkflow']);
  }
}
