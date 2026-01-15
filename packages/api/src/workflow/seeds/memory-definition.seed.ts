/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import {
  MemoryDefinitionDtoConfig,
  MemoryDefinitionTransformerDto,
} from '../dto/memory-definition.dto';
import { MemoryDefinitionOrmEntity } from '../entities/memory-definition.entity';
import { MemoryDefinitionRepository } from '../repositories/memory-definition.repository';

@Injectable()
export class MemoryDefinitionSeeder extends BaseOrmSeeder<
  MemoryDefinitionOrmEntity,
  MemoryDefinitionTransformerDto,
  MemoryDefinitionDtoConfig
> {
  constructor(memoryDefinitionRepository: MemoryDefinitionRepository) {
    super(memoryDefinitionRepository);
  }
}
