/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { MemoryDefinitionOrmEntity } from '../entities/memory-definition.entity';

@Injectable()
export class MemoryDefinitionRepository extends BaseOrmRepository<MemoryDefinitionOrmEntity> {
  constructor(
    @InjectRepository(MemoryDefinitionOrmEntity)
    repository: Repository<MemoryDefinitionOrmEntity>,
  ) {
    super(repository, []);
  }
}
