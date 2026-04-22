/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { MemoryDefinition } from '@hexabot-ai/types';
import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, In } from 'typeorm';

import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { MemoryDefinitionOrmEntity } from '../entities/memory-definition.entity';
import { MemoryDefinitionRepository } from '../repositories/memory-definition.repository';
import { MemoryScope } from '../types';

@Injectable()
export class MemoryDefinitionService extends BaseOrmService<MemoryDefinitionOrmEntity> {
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

  /**
   * Build a cache of memory definitions keyed by slug.
   *
   * Always includes global definitions; when memory definition ids are provided,
   * includes matching workflow/run-scoped definitions.
   *
   * @param memoryDefinitionIds - Optional memory definition identifiers to include.
   * @returns A map of definition slugs to memory definition metadata.
   */
  async buildDefinitionCache(
    memoryDefinitionIds?: string[] | null,
  ): Promise<Map<string, MemoryDefinition>> {
    const where: FindOptionsWhere<MemoryDefinitionOrmEntity>[] = [
      { scope: MemoryScope.global },
    ];
    const requestedIds = Array.from(new Set(memoryDefinitionIds ?? [])).filter(
      Boolean,
    );

    if (requestedIds.length > 0) {
      where.push({ id: In(requestedIds) });
    }

    const definitions = await this.find({ where });
    if (requestedIds.length > 0) {
      const resolvedIds = new Set(
        definitions
          .map((definition) => definition.id)
          .filter((id): id is string => Boolean(id)),
      );
      const missingIds = requestedIds.filter((id) => !resolvedIds.has(id));
      if (missingIds.length > 0) {
        throw new Error(
          `Unable to find memory definition(s): ${missingIds.join(', ')}`,
        );
      }
    }

    const definitionCache = new Map<string, MemoryDefinition>();
    for (const definition of definitions) {
      definitionCache.set(definition.slug, definition);
    }

    return definitionCache;
  }
}
