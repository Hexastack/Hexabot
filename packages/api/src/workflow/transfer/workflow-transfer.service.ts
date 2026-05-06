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

import { WorkflowOrmEntity } from '../entities/workflow.entity';
import { WorkflowVersionService } from '../services/workflow-version.service';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowVersionAction } from '../types';

import { ContentTypeTransferAdapter } from './adapters/content-type-transfer.adapter';
import { CredentialTransferAdapter } from './adapters/credential-transfer.adapter';
import { LabelTransferAdapter } from './adapters/label-transfer.adapter';
import { McpServerTransferAdapter } from './adapters/mcp-server-transfer.adapter';
import { MemoryDefinitionTransferAdapter } from './adapters/memory-definition-transfer.adapter';
import {
  type WorkflowBindingResourceRefs,
  WorkflowTransferDefinitionService,
  type WorkflowTaskResourceRefs,
} from './workflow-transfer-definition.service';
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
    private readonly credentialTransferAdapter: CredentialTransferAdapter,
    private readonly memoryDefinitionTransferAdapter: MemoryDefinitionTransferAdapter,
    private readonly contentTypeTransferAdapter: ContentTypeTransferAdapter,
    private readonly labelTransferAdapter: LabelTransferAdapter,
    private readonly mcpServerTransferAdapter: McpServerTransferAdapter,
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
    const mcpResources =
      await this.mcpServerTransferAdapter.buildExportResources([
        ...bindingRefs.mcpServers,
        ...taskRefs.mcpServers,
      ]);
    const resources = {
      memoryDefinitions:
        await this.memoryDefinitionTransferAdapter.buildExportResources([
          ...bindingRefs.memoryDefinitions,
          ...taskRefs.memoryDefinitions,
        ]),
      mcpServers: mcpResources.mcpServers,
      credentials: await this.credentialTransferAdapter.buildExportResources([
        ...bindingRefs.credentials,
        ...taskRefs.credentials,
        ...mcpResources.credentialIds,
      ]),
      contentTypes: await this.contentTypeTransferAdapter.buildExportResources([
        ...bindingRefs.contentTypes,
        ...taskRefs.contentTypes,
      ]),
      ...(await this.labelTransferAdapter.buildExportResources([
        ...bindingRefs.labels,
        ...taskRefs.labels,
      ])),
    };
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

  private assertBundleContainsReferencedResources(
    bundle: WorkflowExportBundle,
    refs: WorkflowBindingResourceRefs,
    taskRefs: WorkflowTaskResourceRefs,
  ): void {
    this.assertRefsAreBundled(
      'memory definition',
      [...refs.memoryDefinitions, ...taskRefs.memoryDefinitions],
      bundle.resources.memoryDefinitions.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'MCP server',
      [...refs.mcpServers, ...taskRefs.mcpServers],
      bundle.resources.mcpServers.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'credential',
      [
        ...refs.credentials,
        ...taskRefs.credentials,
        ...bundle.resources.mcpServers
          .map((resource) => resource.credentialExportId)
          .filter((id): id is string => typeof id === 'string' && !!id),
      ],
      bundle.resources.credentials.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'content type',
      [...refs.contentTypes, ...taskRefs.contentTypes],
      bundle.resources.contentTypes.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'label',
      [...refs.labels, ...taskRefs.labels],
      bundle.resources.labels.map((resource) => resource.exportId),
    );
    this.assertRefsAreBundled(
      'label group',
      bundle.resources.labels
        .map((resource) => resource.groupExportId)
        .filter((id): id is string => typeof id === 'string' && !!id),
      bundle.resources.labelGroups.map((resource) => resource.exportId),
    );
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

  private async importResources(
    manager: EntityManager,
    resources: WorkflowExportBundle['resources'],
    ownerId: string,
  ): Promise<ImportedWorkflowTransferResources> {
    const credentialResult =
      await this.credentialTransferAdapter.importResources(
        manager,
        resources.credentials,
        ownerId,
      );
    const memoryResult =
      await this.memoryDefinitionTransferAdapter.importResources(
        manager,
        resources.memoryDefinitions,
      );
    const contentTypeResult =
      await this.contentTypeTransferAdapter.importResources(
        manager,
        resources.contentTypes,
      );
    const labelResult = await this.labelTransferAdapter.importResources(
      manager,
      resources.labelGroups,
      resources.labels,
    );
    const mcpResult = await this.mcpServerTransferAdapter.importResources(
      manager,
      resources.mcpServers,
      credentialResult.idMap,
      credentialResult.placeholderExportIds,
    );

    return {
      bindingIdMaps: {
        contentTypes: contentTypeResult.idMap,
        credentials: credentialResult.idMap,
        labels: labelResult.idMap,
        mcpServers: mcpResult.idMap,
        memoryDefinitions: memoryResult.idMap,
      },
      taskIdMaps: {
        contentTypes: contentTypeResult.idMap,
        credentials: credentialResult.idMap,
        labels: labelResult.idMap,
        mcpServers: mcpResult.idMap,
        memoryDefinitions: memoryResult.idMap,
      },
      resources: [
        ...credentialResult.resources,
        ...memoryResult.resources,
        ...contentTypeResult.resources,
        ...labelResult.resources,
        ...mcpResult.resources,
      ],
      warnings: [...credentialResult.warnings, ...mcpResult.warnings],
      postCreateEvents: [
        ...credentialResult.postCreateEvents,
        ...memoryResult.postCreateEvents,
        ...contentTypeResult.postCreateEvents,
        ...labelResult.postCreateEvents,
        ...mcpResult.postCreateEvents,
      ],
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
