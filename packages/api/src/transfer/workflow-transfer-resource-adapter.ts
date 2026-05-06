/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { WorkflowExportBundle } from '@hexabot-ai/types';
import { SetMetadata } from '@nestjs/common';
import { EntityManager } from 'typeorm';

import {
  type WorkflowTransferImportAdapterResult,
  type WorkflowTransferResourceIdMaps,
} from './workflow-transfer.types';

export const WORKFLOW_TRANSFER_ADAPTER_METADATA_KEY =
  'hexabot:workflowTransferAdapter';

export const WorkflowTransferAdapter = (): ClassDecorator =>
  SetMetadata(WORKFLOW_TRANSFER_ADAPTER_METADATA_KEY, true);

export class WorkflowTransferExportContext {
  private readonly refsByKind = new Map<string, Set<string>>();

  constructor(refs: Record<string, string[]>) {
    for (const [kind, ids] of Object.entries(refs)) {
      this.addResourceRefs(kind, ids);
    }
  }

  getRefs(kind: string): string[] {
    return Array.from(this.refsByKind.get(kind) ?? []);
  }

  addResourceRefs(kind: string, ids: string[]): void {
    const refs = this.getRefSet(kind);
    for (const id of ids) {
      refs.add(id);
    }
  }

  toRecord(): Record<string, string[]> {
    return Object.fromEntries(
      Array.from(this.refsByKind.entries()).map(([kind, ids]) => [
        kind,
        Array.from(ids),
      ]),
    );
  }

  private getRefSet(kind: string): Set<string> {
    const existing = this.refsByKind.get(kind);
    if (existing) {
      return existing;
    }

    const refs = new Set<string>();
    this.refsByKind.set(kind, refs);

    return refs;
  }
}

export class WorkflowTransferImportContext {
  private readonly resources: Record<string, unknown[]>;

  private readonly resultsByKind = new Map<
    string,
    WorkflowTransferImportAdapterResult
  >();

  constructor(
    public readonly manager: EntityManager,
    resources: WorkflowExportBundle['resources'],
    public readonly ownerId: string,
  ) {
    this.resources = resources as Record<string, unknown[]>;
  }

  getResources<Resource>(key: string): Resource[] {
    const resources = this.resources[key];

    return Array.isArray(resources) ? (resources as Resource[]) : [];
  }

  getIdMap(kind: string): Record<string, string> {
    return this.resultsByKind.get(kind)?.idMap ?? {};
  }

  getDependencyResult(
    kind: string,
  ): WorkflowTransferImportAdapterResult | undefined {
    return this.resultsByKind.get(kind);
  }

  addResult(kind: string, result: WorkflowTransferImportAdapterResult): void {
    this.resultsByKind.set(kind, result);
  }

  getIdMaps(): WorkflowTransferResourceIdMaps {
    return Object.fromEntries(
      Array.from(this.resultsByKind.entries()).map(([kind, result]) => [
        kind,
        result.idMap,
      ]),
    );
  }

  getResultsInOrder(kinds: string[]): WorkflowTransferImportAdapterResult[] {
    return kinds.flatMap((kind) => {
      const result = this.resultsByKind.get(kind);

      return result ? [result] : [];
    });
  }
}

export abstract class WorkflowTransferResourceAdapter {
  abstract readonly kind: string;

  abstract readonly resourceKeys: readonly string[];

  readonly dependsOn: readonly string[] = [];

  abstract buildExportResources(
    ctx: WorkflowTransferExportContext,
  ): Promise<Record<string, unknown[]>>;

  abstract importResources(
    ctx: WorkflowTransferImportContext,
  ): Promise<WorkflowTransferImportAdapterResult>;
}
