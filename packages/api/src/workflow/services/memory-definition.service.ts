/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, In } from 'typeorm';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import {
  MemoryDefinition,
  MemoryDefinitionDtoConfig,
  MemoryDefinitionTransformerDto,
} from '../dto/memory-definition.dto';
import { MemoryDefinitionOrmEntity } from '../entities/memory-definition.entity';
import { MemoryDefinitionRepository } from '../repositories/memory-definition.repository';
import { MemoryScope } from '../types';

import { WorkflowService } from './workflow.service';

@Injectable()
export class MemoryDefinitionService extends BaseOrmService<
  MemoryDefinitionOrmEntity,
  MemoryDefinitionTransformerDto,
  MemoryDefinitionDtoConfig
> {
  constructor(
    readonly repository: MemoryDefinitionRepository,
    private readonly workflowService: WorkflowService,
  ) {
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

  /**
   * Build a cache of memory definitions keyed by slug.
   *
   * Always includes global definitions; when a workflow id is provided,
   * includes the workflow-scoped definitions attached to that workflow.
   *
   * @param workflowId - Optional workflow identifier to include scoped definitions.
   * @returns A map of definition slugs to memory definition metadata.
   */
  async buildDefinitionCache(
    workflowId?: string | null,
  ): Promise<Map<string, MemoryDefinition>> {
    const where: FindOptionsWhere<MemoryDefinitionOrmEntity>[] = [
      { scope: MemoryScope.global },
    ];

    if (workflowId) {
      const workflow = await this.workflowService.findOne({
        where: { id: workflowId },
      });
      const memoryDefinitionIds = workflow?.memoryDefinitions ?? [];

      if (memoryDefinitionIds.length > 0) {
        where.push({ id: In(memoryDefinitionIds) });
      }
    }

    const definitions = await this.find({ where });
    const definitionCache = new Map<string, MemoryDefinition>();
    for (const definition of definitions) {
      definitionCache.set(definition.slug, definition);
    }

    return definitionCache;
  }
}
