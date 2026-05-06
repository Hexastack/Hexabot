/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { isDeepStrictEqual } from 'node:util';

import {
  type WorkflowExportBundle,
  type WorkflowExportBundleContentType,
  type WorkflowImportResourceResult,
} from '@hexabot-ai/types';
import { ConflictException, Injectable } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

import { ContentTypeOrmEntity } from '@/cms/entities/content-type.entity';
import { ContentTypeService } from '@/cms/services/content-type.service';

import {
  assertFoundAll,
  buildPostCreateEvent,
  buildResourceResult,
  uniqueResourceIds,
  type WorkflowTransferImportAdapterResult,
} from '../workflow-transfer.types';

@Injectable()
export class ContentTypeTransferAdapter {
  constructor(private readonly contentTypeService: ContentTypeService) {}

  async buildExportResources(
    ids: string[],
  ): Promise<WorkflowExportBundleContentType[]> {
    const uniqueIds = uniqueResourceIds(ids);
    if (uniqueIds.length === 0) {
      return [];
    }

    const contentTypes = await this.contentTypeService.find({
      where: { id: In(uniqueIds) },
    });
    assertFoundAll(
      'content type',
      uniqueIds,
      contentTypes.map((contentType) => contentType.id),
    );

    return contentTypes.map((contentType) => ({
      exportId: contentType.id,
      name: contentType.name,
      schema: contentType.schema,
    }));
  }

  async importResources(
    manager: EntityManager,
    contentTypes: WorkflowExportBundle['resources']['contentTypes'],
  ): Promise<WorkflowTransferImportAdapterResult> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const postCreateEvents: WorkflowTransferImportAdapterResult['postCreateEvents'] =
      [];

    for (const contentType of contentTypes) {
      const existing = await manager.findOne(ContentTypeOrmEntity, {
        where: { name: contentType.name },
      });

      if (existing) {
        if (!this.isEquivalentContentType(existing, contentType)) {
          throw new ConflictException(
            `Content type "${contentType.name}" already exists with different configuration`,
          );
        }

        idMap[contentType.exportId] = existing.id;
        resources.push(
          buildResourceResult({
            kind: 'contentType',
            exportId: contentType.exportId,
            localId: existing.id,
            name: contentType.name,
            action: 'reused',
          }),
        );
        continue;
      }

      const payload = {
        name: contentType.name,
        schema: contentType.schema,
      };
      const created = await manager.save(
        ContentTypeOrmEntity,
        manager.create(ContentTypeOrmEntity, payload),
      );

      idMap[contentType.exportId] = created.id;
      resources.push(
        buildResourceResult({
          kind: 'contentType',
          exportId: contentType.exportId,
          localId: created.id,
          name: contentType.name,
          action: 'created',
        }),
      );
      postCreateEvents.push(
        buildPostCreateEvent('contentType', created, payload),
      );
    }

    return {
      idMap,
      resources,
      warnings: [],
      postCreateEvents,
    };
  }

  private isEquivalentContentType(
    existing: ContentTypeOrmEntity,
    imported: WorkflowExportBundle['resources']['contentTypes'][number],
  ): boolean {
    return isDeepStrictEqual(existing.schema, imported.schema);
  }
}
