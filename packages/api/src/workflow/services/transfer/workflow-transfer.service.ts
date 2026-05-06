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
import sanitizeFilename from 'sanitize-filename';
import { DataSource, EntityManager } from 'typeorm';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

import { WorkflowVersionOrmEntity } from '../../entities/workflow-version.entity';
import { WorkflowOrmEntity } from '../../entities/workflow.entity';
import { WorkflowVersionAction } from '../../types';
import { WorkflowService } from '../workflow.service';

import { WorkflowTransferDefinitionService } from './workflow-transfer-definition.service';
import { WorkflowTransferResourceService } from './workflow-transfer-resource.service';

type ExportedWorkflowFile = {
  filename: string;
  content: string;
};

@Injectable()
export class WorkflowTransferService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly workflowService: WorkflowService,
    private readonly workflowTransferDefinitionService: WorkflowTransferDefinitionService,
    private readonly workflowTransferResourceService: WorkflowTransferResourceService,
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
    const resources =
      await this.workflowTransferResourceService.buildExportResources(
        bindingRefs,
        taskRefs,
      );
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

    this.workflowTransferResourceService.assertBundleContainsReferencedResources(
      bundle,
      bindingRefs,
      taskRefs,
    );

    const { workflowId, resources, warnings } =
      await this.dataSource.transaction(async (manager) => {
        const importedResources =
          await this.workflowTransferResourceService.importResources(
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
        const workflow = await manager.save(
          WorkflowOrmEntity,
          manager.create(WorkflowOrmEntity, {
            name: workflowName,
            description: bundle.workflow.description,
            type: bundle.workflow.type,
            schedule: bundle.workflow.schedule,
            inputSchema: bundle.workflow.inputSchema,
            builtin: false,
            x: bundle.workflow.layout.x,
            y: bundle.workflow.layout.y,
            zoom: bundle.workflow.layout.zoom,
            direction: bundle.workflow.layout.direction,
            createdBy: { id: createdBy },
            publishedVersion: null,
          }),
        );
        const latestVersion = await manager.findOne(WorkflowVersionOrmEntity, {
          where: { workflow: { id: workflow.id } },
          order: { version: 'DESC' },
        });
        await manager.save(
          WorkflowVersionOrmEntity,
          manager.create(WorkflowVersionOrmEntity, {
            workflow: { id: workflow.id },
            version: latestVersion ? latestVersion.version + 1 : 1,
            definitionYml,
            action: WorkflowVersionAction.import,
            message:
              bundle.version.message ??
              `Imported from workflow version ${bundle.version.number}`,
            parentVersion: null,
            createdBy: { id: createdBy },
          }),
        );

        return {
          workflowId: workflow.id,
          resources: importedResources.resources,
          warnings: importedResources.warnings,
        };
      });
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
