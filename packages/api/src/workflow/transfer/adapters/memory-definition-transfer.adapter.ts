/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { isDeepStrictEqual } from 'node:util';

import {
  type WorkflowExportBundle,
  type WorkflowExportBundleMemoryDefinition,
  type WorkflowImportResourceResult,
} from '@hexabot-ai/types';
import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

import { MemoryDefinitionOrmEntity } from '@/workflow/entities/memory-definition.entity';
import { MemoryDefinitionService } from '@/workflow/services/memory-definition.service';

import {
  assertFoundAll,
  buildPostCreateEvent,
  buildResourceResult,
  uniqueResourceIds,
  type WorkflowTransferImportAdapterResult,
} from '../workflow-transfer.types';

@Injectable()
export class MemoryDefinitionTransferAdapter {
  constructor(
    private readonly memoryDefinitionService: MemoryDefinitionService,
  ) {}

  async buildExportResources(
    ids: string[],
  ): Promise<WorkflowExportBundleMemoryDefinition[]> {
    const uniqueIds = uniqueResourceIds(ids);
    if (uniqueIds.length === 0) {
      return [];
    }

    const definitions = await this.memoryDefinitionService.find({
      where: { id: In(uniqueIds) },
    });
    assertFoundAll(
      'memory definition',
      uniqueIds,
      definitions.map((definition) => definition.id),
    );

    return definitions.map((definition) => ({
      exportId: definition.id,
      name: definition.name,
      slug: definition.slug,
      scope: definition.scope,
      schema: definition.schema,
      ttlSeconds: definition.ttlSeconds ?? null,
    }));
  }

  async importResources(
    manager: EntityManager,
    definitions: WorkflowExportBundle['resources']['memoryDefinitions'],
  ): Promise<WorkflowTransferImportAdapterResult> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const postCreateEvents: WorkflowTransferImportAdapterResult['postCreateEvents'] =
      [];

    for (const definition of definitions) {
      const existing = await manager.findOne(MemoryDefinitionOrmEntity, {
        where: { slug: definition.slug },
      });

      if (existing) {
        if (!this.isEquivalentMemoryDefinition(existing, definition)) {
          throw new ConflictException(
            `Memory definition "${definition.slug}" already exists with different configuration`,
          );
        }

        idMap[definition.exportId] = existing.id;
        resources.push(
          buildResourceResult({
            kind: 'memoryDefinition',
            exportId: definition.exportId,
            localId: existing.id,
            name: definition.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const payload = {
        name: definition.name,
        slug: definition.slug,
        scope: definition.scope,
        schema: definition.schema,
        ttlSeconds: definition.ttlSeconds ?? null,
      };
      const created = await manager.save(
        MemoryDefinitionOrmEntity,
        manager.create(MemoryDefinitionOrmEntity, payload),
      );

      idMap[definition.exportId] = created.id;
      resources.push(
        buildResourceResult({
          kind: 'memoryDefinition',
          exportId: definition.exportId,
          localId: created.id,
          name: definition.name,
          action: 'created',
        }),
      );
      postCreateEvents.push(
        buildPostCreateEvent('memoryDefinition', created, payload),
      );
    }

    return {
      idMap,
      resources,
      warnings: [],
      postCreateEvents,
    };
  }

  private isEquivalentMemoryDefinition(
    existing: MemoryDefinitionOrmEntity,
    imported: WorkflowExportBundle['resources']['memoryDefinitions'][number],
  ): boolean {
    return (
      existing.name === imported.name &&
      existing.scope === imported.scope &&
      (existing.ttlSeconds ?? null) === (imported.ttlSeconds ?? null) &&
      isDeepStrictEqual(existing.schema, imported.schema)
    );
  }
}
