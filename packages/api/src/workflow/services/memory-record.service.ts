/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  MemoryRecordDtoConfig,
  MemoryRecordTransformerDto,
} from '../dto/memory-record.dto';
import { MemoryRecordOrmEntity } from '../entities/memory-record.entity';
import { MemoryRecordRepository } from '../repositories/memory-record.repository';

@Injectable()
export class MemoryRecordService extends BaseOrmService<
  MemoryRecordOrmEntity,
  MemoryRecordTransformerDto,
  MemoryRecordDtoConfig
> {
  constructor(readonly repository: MemoryRecordRepository) {
    super(repository);
  }
}
