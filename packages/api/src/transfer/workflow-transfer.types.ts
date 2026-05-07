/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowImportResourceResult } from '@hexabot-ai/types';
import { BadRequestException } from '@nestjs/common';

import { BaseOrmEntity } from '@/database/entities/base.entity';

/**
 * Workflow transfer persistence contract:
 * - WorkflowTransferService owns the import transaction boundary.
 * - Resource adapters receive EntityManager for transactional writes.
 * - Export reads use owning module services wherever available.
 * - Transfer does not introduce duplicate repositories for owned resources.
 */

export const PLACEHOLDER_CREDENTIAL_VALUE =
  '__HEXABOT_IMPORTED_CREDENTIAL_PLACEHOLDER__';

export type WorkflowTransferPostCreateEvent<
  Entity extends BaseOrmEntity<any> = BaseOrmEntity<any>,
> = {
  entityName: string;
  entity: Entity;
  payload: unknown;
};

export type WorkflowTransferImportAdapterResult = {
  idMap: Record<string, string>;
  resources: WorkflowImportResourceResult[];
  warnings: string[];
  postCreateEvents: WorkflowTransferPostCreateEvent[];
  metadata?: Record<string, unknown>;
};

export type WorkflowTransferResourceIdMaps = Record<
  string,
  Record<string, string>
>;

export type ImportedWorkflowTransferResources = {
  bindingIdMaps: WorkflowTransferResourceIdMaps;
  taskIdMaps: WorkflowTransferResourceIdMaps;
  resources: WorkflowImportResourceResult[];
  warnings: string[];
  postCreateEvents: WorkflowTransferPostCreateEvent[];
};

type ResourceActionInput = Omit<WorkflowImportResourceResult, 'localId'> & {
  localId?: string;
};

export const uniqueResourceIds = (ids: string[]): string[] => {
  return Array.from(new Set(ids));
};

export const assertFoundAll = (
  resourceLabel: string,
  expectedIds: string[],
  foundIds: string[],
): void => {
  const found = new Set(foundIds);
  const missing = expectedIds.filter((id) => !found.has(id));
  if (missing.length > 0) {
    throw new BadRequestException(
      `Unable to export workflow: missing ${resourceLabel}(s): ${missing.join(
        ', ',
      )}`,
    );
  }
};

export const buildResourceResult = (
  input: ResourceActionInput,
): WorkflowImportResourceResult => {
  if (!input.localId) {
    throw new Error(`Missing local ID for imported ${input.kind}`);
  }

  return {
    kind: input.kind,
    exportId: input.exportId,
    localId: input.localId,
    name: input.name,
    action: input.action,
  };
};

export const buildPostCreateEvent = <Entity extends BaseOrmEntity<any>>(
  entityName: string,
  entity: Entity,
  payload: unknown,
): WorkflowTransferPostCreateEvent<Entity> => {
  return { entityName, entity, payload };
};
