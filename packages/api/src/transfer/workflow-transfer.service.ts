/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Workflow as AgenticWorkflow } from '@hexabot-ai/agentic';
import {
  WORKFLOW_EXPORT_BUNDLE_KIND,
  type WorkflowExportBundle,
  type WorkflowImportResult,
  workflowExportBundleSchema,
  workflowImportResultSchema,
} from '@hexabot-ai/types';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import sanitizeFilename from 'sanitize-filename';
import { DataSource, EntityManager } from 'typeorm';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { EHook } from '@/utils/generics/base-orm.repository';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import { WorkflowVersionService } from '@/workflow/services/workflow-version.service';
import { WorkflowService } from '@/workflow/services/workflow.service';
import { WorkflowVersionAction } from '@/workflow/types';

import { WorkflowTransferAdapterRegistry } from './workflow-transfer-adapter.registry';
import {
  type WorkflowBindingResourceRefs,
  WorkflowTransferDefinitionService,
  type WorkflowTaskResourceRefs,
} from './workflow-transfer-definition.service';
import {
  WorkflowTransferExportContext,
  WorkflowTransferImportContext,
  type WorkflowTransferResourceAdapter,
} from './workflow-transfer-resource-adapter';
import {
  buildPostCreateEvent,
  type ImportedWorkflowTransferResources,
  type WorkflowTransferPostCreateEvent,
} from './workflow-transfer.types';

type ExportedWorkflowFile = {
  filename: string;
  content: string;
};

@Injectable()
export class WorkflowTransferService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly workflowService: WorkflowService,
    private readonly workflowVersionService: WorkflowVersionService,
    private readonly workflowTransferDefinitionService: WorkflowTransferDefinitionService,
    private readonly workflowTransferAdapterRegistry: WorkflowTransferAdapterRegistry,
  ) {}

  async exportWorkflow(id: string): Promise<ExportedWorkflowFile> {
    const workflow = await this.workflowService.findOneAndPopulate(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    const version = workflow.currentVersion;
    if (!version?.definitionYml) {
      throw new BadRequestException(
        'Workflow must have a current version to be exported',
      );
    }

    const definition =
      this.workflowTransferDefinitionService.parseWithLocalCatalog(
        version.definitionYml,
      );
    const bindingRefs =
      this.workflowTransferDefinitionService.collectBindingResourceRefs(
        definition,
      );
    const taskRefs =
      this.workflowTransferDefinitionService.collectTaskResourceRefs(
        definition,
      );
    const resources = await this.buildExportResources(bindingRefs, taskRefs);
    const bundle: WorkflowExportBundle = {
      kind: WORKFLOW_EXPORT_BUNDLE_KIND,
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      workflow: {
        name: workflow.name,
        description: workflow.description ?? null,
        type: workflow.type,
        schedule: workflow.schedule ?? null,
        inputSchema: workflow.inputSchema,
        layout: {
          x: workflow.x,
          y: workflow.y,
          zoom: workflow.zoom,
          direction: workflow.direction,
        },
      },
      version: {
        number: version.version,
        checksum: version.checksum,
        message: version.message ?? null,
        exportedVersionId: version.id,
      },
      definitionYml: version.definitionYml,
      resources,
    };

    return {
      filename: this.buildExportFilename(workflow.name),
      content: stringifyYaml(workflowExportBundleSchema.parse(bundle), {
        lineWidth: 0,
      }),
    };
  }

  async importWorkflow(
    content: string,
    createdBy: string,
  ): Promise<WorkflowImportResult> {
    const bundle = this.parseBundle(content);
    const definition =
      this.workflowTransferDefinitionService.parseWithLocalCatalog(
        bundle.definitionYml,
      );
    const bindingRefs =
      this.workflowTransferDefinitionService.collectBindingResourceRefs(
        definition,
      );
    const taskRefs =
      this.workflowTransferDefinitionService.collectTaskResourceRefs(
        definition,
      );

    this.assertBundleResourceBucketsAreSupported(bundle.resources);
    this.assertBundleContainsReferencedResources(bundle, bindingRefs, taskRefs);

    const { workflowId, resources, warnings, postCreateEvents } =
      await this.dataSource.transaction(async (manager) => {
        const importedResources = await this.importResources(
          manager,
          bundle.resources,
          createdBy,
        );
        const remappedBindingDefinition =
          this.workflowTransferDefinitionService.remapBindingResourceRefs(
            definition,
            importedResources.bindingIdMaps,
          );
        const remappedDefinition =
          this.workflowTransferDefinitionService.remapTaskResourceRefs(
            remappedBindingDefinition,
            importedResources.taskIdMaps,
          );
        const definitionYml =
          AgenticWorkflow.stringifyDefinition(remappedDefinition);

        this.workflowTransferDefinitionService.parseWithLocalCatalog(
          definitionYml,
        );

        const workflowName = await this.buildImportedWorkflowName(
          manager,
          bundle.workflow.name,
        );
        const workflowPayload = {
          name: workflowName,
          description: bundle.workflow.description ?? undefined,
          type: bundle.workflow.type,
          schedule: bundle.workflow.schedule,
          inputSchema: bundle.workflow.inputSchema,
          builtin: false,
          x: bundle.workflow.layout.x,
          y: bundle.workflow.layout.y,
          zoom: bundle.workflow.layout.zoom,
          direction: bundle.workflow.layout.direction,
          createdBy,
        };
        const workflow = await this.workflowService.createWithManager(
          manager,
          workflowPayload,
        );
        const workflowVersionPayload = {
          workflow: workflow.id,
          definitionYml,
          action: WorkflowVersionAction.import,
          message:
            bundle.version.message ??
            `Imported from workflow version ${bundle.version.number}`,
          parentVersion: null,
          createdBy,
        };
        const workflowVersion =
          await this.workflowVersionService.createSnapshotWithManager(
            manager,
            workflowVersionPayload,
          );

        return {
          workflowId: workflow.id,
          resources: importedResources.resources,
          warnings: importedResources.warnings,
          postCreateEvents: [
            ...importedResources.postCreateEvents,
            buildPostCreateEvent('workflow', workflow, workflowPayload),
            buildPostCreateEvent(
              'workflowVersion',
              workflowVersion,
              workflowVersionPayload,
            ),
          ],
        };
      });
    await this.emitPostCreateEvents(postCreateEvents);

    const workflow = await this.workflowService.findOne(workflowId);
    if (!workflow) {
      throw new Error(`Unable to load imported workflow ${workflowId}`);
    }

    return workflowImportResultSchema.parse({
      workflow,
      resources,
      warnings,
    });
  }

  private parseBundle(content: string): WorkflowExportBundle {
    let parsed: unknown;
    try {
      parsed = parseYaml(content);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid workflow bundle YAML',
      );
    }

    const validation = workflowExportBundleSchema.safeParse(parsed);
    if (!validation.success) {
      throw new BadRequestException(
        validation.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; '),
      );
    }

    return validation.data;
  }

  private async buildExportResources(
    bindingRefs: WorkflowBindingResourceRefs,
    taskRefs: WorkflowTaskResourceRefs,
  ): Promise<WorkflowExportBundle['resources']> {
    const resources = this.createEmptyResourceBuckets();
    const exportContext = new WorkflowTransferExportContext(
      this.mergeResourceRefs(bindingRefs, taskRefs),
    );

    for (const adapter of this.workflowTransferAdapterRegistry.listInReverseDependencyOrder()) {
      const adapterResources =
        await adapter.buildExportResources(exportContext);
      this.mergeAdapterResources(resources, adapter, adapterResources);
    }

    return resources as WorkflowExportBundle['resources'];
  }

  private assertBundleContainsReferencedResources(
    bundle: WorkflowExportBundle,
    refs: WorkflowBindingResourceRefs,
    taskRefs: WorkflowTaskResourceRefs,
  ): void {
    for (const [kind, resourceRefs] of Object.entries(
      this.mergeResourceRefs(refs, taskRefs),
    )) {
      if (resourceRefs.length === 0) {
        continue;
      }

      const adapter = this.workflowTransferAdapterRegistry.get(kind);
      if (!adapter) {
        throw new BadRequestException(
          `Workflow bundle references unsupported resource kind "${kind}"`,
        );
      }

      this.assertRefsAreBundled(
        kind,
        resourceRefs,
        this.getBundledExportIds(bundle.resources, adapter.resourceKeys[0]),
      );
    }
  }

  private assertRefsAreBundled(
    resourceLabel: string,
    refs: string[],
    bundledIds: string[],
  ): void {
    const bundled = new Set(bundledIds);
    const missing = Array.from(new Set(refs)).filter((id) => !bundled.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(
        `Workflow bundle is missing referenced ${resourceLabel}(s): ${missing.join(
          ', ',
        )}`,
      );
    }
  }

  private assertBundleResourceBucketsAreSupported(
    resources: WorkflowExportBundle['resources'],
  ): void {
    const supportedResourceKeys = new Set(
      this.workflowTransferAdapterRegistry.getResourceKeys(),
    );

    for (const [key, value] of Object.entries(
      resources as Record<string, unknown[]>,
    )) {
      if (supportedResourceKeys.has(key) || value.length === 0) {
        continue;
      }

      throw new BadRequestException(
        `Workflow bundle contains unsupported resource section "${key}"`,
      );
    }
  }

  private createEmptyResourceBuckets(): Record<string, unknown[]> {
    return Object.fromEntries(
      this.workflowTransferAdapterRegistry
        .listInDependencyOrder()
        .flatMap((adapter) =>
          adapter.resourceKeys.map((resourceKey) => [
            resourceKey,
            [] as unknown[],
          ]),
        ),
    );
  }

  private mergeAdapterResources(
    resources: Record<string, unknown[]>,
    adapter: WorkflowTransferResourceAdapter,
    adapterResources: Record<string, unknown[]>,
  ): void {
    const declaredResourceKeys = new Set(adapter.resourceKeys);

    for (const [key, value] of Object.entries(adapterResources)) {
      if (!declaredResourceKeys.has(key)) {
        throw new Error(
          `Workflow transfer adapter "${adapter.kind}" returned undeclared resource key "${key}"`,
        );
      }

      if (!Array.isArray(value)) {
        throw new Error(
          `Workflow transfer adapter "${adapter.kind}" returned non-array resources for "${key}"`,
        );
      }

      resources[key] = value;
    }

    for (const resourceKey of adapter.resourceKeys) {
      resources[resourceKey] ??= [];
    }
  }

  private mergeResourceRefs(
    refs: WorkflowBindingResourceRefs,
    taskRefs: WorkflowTaskResourceRefs,
  ): Record<string, string[]> {
    const merged = new Map<string, Set<string>>();

    for (const refSet of [refs, taskRefs]) {
      for (const [kind, ids] of Object.entries(refSet)) {
        const kindRefs = merged.get(kind) ?? new Set<string>();
        for (const id of ids) {
          kindRefs.add(id);
        }
        merged.set(kind, kindRefs);
      }
    }

    return Object.fromEntries(
      Array.from(merged.entries()).map(([kind, ids]) => [
        kind,
        Array.from(ids),
      ]),
    );
  }

  private getBundledExportIds(
    resources: WorkflowExportBundle['resources'],
    resourceKey: string,
  ): string[] {
    const resourceBucket = (resources as Record<string, unknown[]>)[
      resourceKey
    ];

    return (resourceBucket ?? []).flatMap((resource) => {
      if (
        typeof resource === 'object' &&
        resource !== null &&
        'exportId' in resource &&
        typeof resource.exportId === 'string'
      ) {
        return [resource.exportId];
      }

      return [];
    });
  }

  private async importResources(
    manager: EntityManager,
    resources: WorkflowExportBundle['resources'],
    ownerId: string,
  ): Promise<ImportedWorkflowTransferResources> {
    const adapters =
      this.workflowTransferAdapterRegistry.listInDependencyOrder();
    const importContext = new WorkflowTransferImportContext(
      manager,
      resources,
      ownerId,
    );

    for (const adapter of adapters) {
      importContext.addResult(
        adapter.kind,
        await adapter.importResources(importContext),
      );
    }

    const results = importContext.getResultsInOrder(
      adapters.map((adapter) => adapter.kind),
    );
    const idMaps = importContext.getIdMaps();

    return {
      bindingIdMaps: idMaps,
      taskIdMaps: idMaps,
      resources: results.flatMap((result) => result.resources),
      warnings: results.flatMap((result) => result.warnings),
      postCreateEvents: results.flatMap((result) => result.postCreateEvents),
    };
  }

  private async emitPostCreateEvents(
    events: WorkflowTransferPostCreateEvent[],
  ): Promise<void> {
    for (const event of events) {
      await this.eventEmitter.emitAsync(`hook:${event.entityName}:postCreate`, {
        action: EHook.postCreate,
        entity: event.entity,
        payload: event.payload,
        entityName: event.entityName,
      });
    }
  }

  private async buildImportedWorkflowName(
    manager: EntityManager,
    sourceName: string,
  ): Promise<string> {
    const baseName = sourceName.trim() || 'Imported workflow';
    const suffixes = [
      '',
      ' (imported)',
      ...Array.from({ length: 999 }, (_, index) => {
        return ` (imported ${index + 2})`;
      }),
    ];

    for (const suffix of suffixes) {
      const normalized = this.truncateWorkflowName(baseName, suffix);
      const existing = await manager.findOne(WorkflowOrmEntity, {
        where: { name: normalized },
      });
      if (!existing) {
        return normalized;
      }
    }

    throw new ConflictException('Unable to generate a unique workflow name');
  }

  private truncateWorkflowName(name: string, suffix = ''): string {
    const maxBaseLength = Math.max(1, 255 - suffix.length);
    const normalizedBase =
      name.length <= maxBaseLength ? name : name.slice(0, maxBaseLength);

    return `${normalizedBase}${suffix}`;
  }

  private buildExportFilename(name: string): string {
    const safeName = sanitizeFilename(name.trim()) || 'workflow';

    return `${safeName}.workflow.yml`;
  }
}
