/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { WorkflowRuntimeContext } from '../contexts/workflow-runtime.context';
import { MemoryStoreIdentifier } from '../types';
import { MemoryStore } from '../utils/memory-store';

import { MemoryDefinitionService } from './memory-definition.service';
import { MemoryRecordService } from './memory-record.service';

@Injectable()
export class MemoryService {
  constructor(
    private readonly memoryDefinitionService: MemoryDefinitionService,
    private readonly memoryRecordService: MemoryRecordService,
  ) {}

  /**
   * Build a structured memory store for a given owner, keyed by slug.
   */
  async buildStore(
    {
      ownerId,
      workflowId,
      threadId,
      runId,
      memoryDefinitionIds,
    }: MemoryStoreIdentifier,
    context: WorkflowRuntimeContext,
  ): Promise<MemoryStore> {
    const definitionCache =
      await this.memoryDefinitionService.buildDefinitionCache(
        memoryDefinitionIds,
      );
    const records = await this.memoryRecordService.findActiveByScope({
      ownerId,
      workflowId,
      threadId,
      runId,
    });

    return MemoryStore.createStore(
      {
        identifiers: { ownerId, workflowId, threadId, runId },
        definitionCache,
        records,
        upsertRecord: (params) =>
          this.memoryRecordService.upsertScopedRecord(params),
      },
      context,
    );
  }
}
