/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { MemoryRecordDtoConfig } from '../dto/memory-record.dto';
import { MemoryRecordOrmEntity } from '../entities/memory-record.entity';

@Injectable()
export class MemoryRecordRepository extends BaseOrmRepository<
  MemoryRecordOrmEntity,
  MemoryRecordDtoConfig
> {
  constructor(
    @InjectRepository(MemoryRecordOrmEntity)
    repository: Repository<MemoryRecordOrmEntity>,
  ) {
    super(repository, ['definition', 'owner', 'workflow', 'run']);
  }
}
