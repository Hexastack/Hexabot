/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { FindOptionsWhere } from 'typeorm';

import { MemoryRecordOrmEntity } from '../entities/memory-record.entity';
import { MemoryScope } from '../types';

import { MemoryDefinitionService } from './memory-definition.service';
import { MemoryRecordService } from './memory-record.service';

export type MemoryStore = Record<MemoryScope, Record<string, unknown>>;

export type BuildMemoryStoreOptions = {
  ownerId?: string | null;
  workflowId?: string | null;
  runId?: string | null;
};

@Injectable()
export class MemoryService {
  constructor(
    private readonly memoryDefinitionService: MemoryDefinitionService,
    private readonly memoryRecordService: MemoryRecordService,
  ) {}

  /**
   * Build a structured memory store for a given owner, grouped by scope then slug.
   */
  async buildStore({
    ownerId,
    workflowId,
    runId,
  }: BuildMemoryStoreOptions): Promise<MemoryStore> {
    const store: MemoryStore = {
      [MemoryScope.global]: {},
      [MemoryScope.workflow]: {},
      [MemoryScope.run]: {},
    };

    if (!ownerId) {
      return store;
    }

    const where: FindOptionsWhere<MemoryRecordOrmEntity>[] = [
      {
        owner: { id: ownerId },
        definition: { scope: MemoryScope.global },
      },
    ];

    if (workflowId) {
      where.push({
        owner: { id: ownerId },
        workflow: { id: workflowId },
        definition: { scope: MemoryScope.workflow },
      });
    }

    if (runId) {
      where.push({
        owner: { id: ownerId },
        run: { id: runId },
        definition: { scope: MemoryScope.run },
      });
    }

    const records = await this.memoryRecordService.findAndPopulate({
      where,
      order: {
        updatedAt: 'DESC',
        createdAt: 'DESC',
      },
    });
    const now = Date.now();
    const finalStore = records.reduce((acc, record) => {
      if (record.expiresAt && record.expiresAt.getTime() <= now) {
        return acc;
      }

      const { definition, value } = record;
      const { slug, scope } = definition;
      const scopedStore = acc[scope];
      if (Object.prototype.hasOwnProperty.call(scopedStore, slug)) {
        return acc;
      }

      scopedStore[slug] = value;

      return acc;
    }, store);

    return finalStore;
  }
}
