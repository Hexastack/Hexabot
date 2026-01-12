/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  MemoryDefinition,
  MemoryDefinitionDtoConfig,
  MemoryDefinitionTransformerDto,
} from '../dto/memory-definition.dto';
import { MemoryDefinitionOrmEntity } from '../entities/memory-definition.entity';
import { MemoryDefinitionRepository } from '../repositories/memory-definition.repository';

@Injectable()
export class MemoryDefinitionService extends BaseOrmService<
  MemoryDefinitionOrmEntity,
  MemoryDefinitionTransformerDto,
  MemoryDefinitionDtoConfig
> {
  constructor(readonly repository: MemoryDefinitionRepository) {
    super(repository);
  }

  /**
   * Find a memory definition by its slug identifier.
   *
   * @param slug - The slug to look up.
   * @returns The matching memory definition or `null` when not found.
   */
  async findBySlug(slug: string): Promise<MemoryDefinition | null> {
    return await this.findOne({ where: { slug } });
  }
}
