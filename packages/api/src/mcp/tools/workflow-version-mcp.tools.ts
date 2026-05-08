/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { validateWorkflow } from '@hexabot-ai/agentic';
import { Action } from '@hexabot-ai/types';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Tool, ToolGuards } from '@rekog/mcp-nest';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { RuntimeBindingsService } from '@/bindings/runtime-bindings.service';
import { WorkflowVersionOrmEntity } from '@/workflow/entities/workflow-version.entity';
import { WorkflowVersionService } from '@/workflow/services/workflow-version.service';
import { WorkflowVersionAction } from '@/workflow/types';

import { McpPermission } from '../decorators/mcp-permission.decorator';
import { McpPermissionGuard } from '../guards/mcp-permission.guard';
import { HexabotMcpRequest } from '../types';

import { HexabotMcpToolBase } from './hexabot-mcp-tool.base';
import {
  PaginationArgs,
  paginationSchema,
  uuidSchema,
} from './hexabot-mcp.schemas';
import { HexabotWorkflowMcpHelper } from './workflow-mcp.helper';

@Injectable()
export class HexabotWorkflowVersionMcpTools extends HexabotMcpToolBase {
  constructor(
    private readonly workflowVersionService: WorkflowVersionService,
    private readonly actionService: ActionService,
    private readonly runtimeBindingsService: RuntimeBindingsService,
    private readonly workflowHelper: HexabotWorkflowMcpHelper,
  ) {
    super();
  }

  @McpPermission('workflowversion', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_yaml_commit',
    description:
      'Validate and commit workflow definition YAML as a new version.',
    parameters: z.object({
      workflowId: uuidSchema,
      definitionYml: z.string().min(1),
      message: z.string().optional(),
      parentVersion: uuidSchema.nullable().optional(),
      action: z
        .enum(WorkflowVersionAction)
        .default(WorkflowVersionAction.update),
    }),
  })
  async commitWorkflowYaml(
    args: {
      workflowId: string;
      definitionYml: string;
      message?: string;
      parentVersion?: string | null;
      action: WorkflowVersionAction;
    },
    _context: unknown,
    request?: HexabotMcpRequest,
  ) {
    const actorId = this.getActorId(request);

    return await this.workflowHelper.commitWorkflowDefinition({
      ...args,
      createdBy: actorId,
    });
  }

  @McpPermission('workflow', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_yaml_validate',
    description:
      'Validate workflow definition YAML without creating a workflow version.',
    parameters: z.object({
      definitionYml: z.string().min(1),
      validateActions: z.boolean().default(true),
    }),
  })
  async validateWorkflowYaml(args: {
    definitionYml: string;
    validateActions?: boolean;
  }) {
    const validateActions = args.validateActions ?? true;
    const validation = validateWorkflow(args.definitionYml, {
      bindingKinds: this.runtimeBindingsService.getRegistry(),
      ...(validateActions
        ? { actions: this.getWorkflowValidationActions() }
        : {}),
    });

    if (!validation.success) {
      return { valid: false, errors: validation.errors };
    }

    return { valid: true, errors: [], definition: validation.data };
  }

  @McpPermission('workflowversion', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_version_search',
    description: 'List workflow definition YAML versions for a workflow.',
    parameters: z.object({
      workflowId: uuidSchema,
      ...paginationSchema,
      sortBy: z.string().default('version'),
      sortDirection: z.enum(['ASC', 'DESC']).default('DESC'),
    }),
  })
  async searchWorkflowVersions(args: { workflowId: string } & PaginationArgs) {
    const where = { workflow: { id: args.workflowId } } as any;

    return await this.listWithCount(
      this.workflowVersionService,
      this.findOptions<WorkflowVersionOrmEntity>(args, where),
    );
  }

  @McpPermission('workflowversion', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_version_get',
    description: 'Read one workflow definition YAML version.',
    parameters: z.object({
      id: uuidSchema,
      workflowId: uuidSchema.optional(),
    }),
  })
  async getWorkflowVersion(args: { id: string; workflowId?: string }) {
    const version = await this.workflowVersionService.findOneAndPopulate({
      where: {
        id: args.id,
        ...(args.workflowId ? { workflow: { id: args.workflowId } } : {}),
      } as any,
    });

    if (!version) {
      throw new NotFoundException(`Workflow version ${args.id} not found`);
    }

    return version;
  }

  @McpPermission('workflowversion', Action.UPDATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_version_update',
    description:
      'Update workflow version metadata such as the version message.',
    parameters: z.object({
      id: uuidSchema,
      message: z.string().nullable().optional(),
    }),
  })
  async updateWorkflowVersion(args: { id: string; message?: string | null }) {
    return await this.workflowVersionService.updateOne(args.id, {
      message: args.message ?? undefined,
    });
  }

  @McpPermission('workflowversion', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_version_restore',
    description:
      'Restore a workflow to a previous YAML version by creating a new restore snapshot.',
    parameters: z.object({
      workflowId: uuidSchema,
      versionId: uuidSchema,
      message: z.string().optional(),
    }),
  })
  async restoreWorkflowVersion(
    args: { workflowId: string; versionId: string; message?: string },
    _context: unknown,
    request?: HexabotMcpRequest,
  ) {
    return await this.workflowHelper.restoreWorkflowVersionSnapshot(
      args,
      this.getActorId(request),
    );
  }

  @McpPermission('workflowversion', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_rollback',
    description:
      'Rollback a workflow to a previous YAML version by creating a new current restore snapshot.',
    parameters: z.object({
      workflowId: uuidSchema,
      versionId: uuidSchema,
      message: z.string().optional(),
    }),
  })
  async rollbackWorkflowVersion(
    args: { workflowId: string; versionId: string; message?: string },
    _context: unknown,
    request?: HexabotMcpRequest,
  ) {
    return await this.workflowHelper.restoreWorkflowVersionSnapshot(
      args,
      this.getActorId(request),
    );
  }

  private getWorkflowValidationActions() {
    return Object.fromEntries(
      Object.entries(this.actionService.getRegistry()).map(
        ([actionName, action]) => [
          actionName,
          { supportedBindings: action.supportedBindings ?? [] },
        ],
      ),
    );
  }
}
