/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Action, type User } from '@hexabot-ai/types';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Tool, ToolGuards } from '@rekog/mcp-nest';
import { FindManyOptions, Like } from 'typeorm';
import { z } from 'zod';

import { ActionService } from '@/actions/actions.service';
import { RuntimeBindingsService } from '@/bindings/runtime-bindings.service';
import { ContentTypeOrmEntity } from '@/cms/entities/content-type.entity';
import { ContentOrmEntity } from '@/cms/entities/content.entity';
import { ContentTypeService } from '@/cms/services/content-type.service';
import { ContentService } from '@/cms/services/content.service';
import { CredentialService } from '@/user/services/credential.service';
import { WorkflowNewVersionDto } from '@/workflow/dto/workflow-version.dto';
import { McpServerOrmEntity } from '@/workflow/entities/mcp-server.entity';
import { WorkflowRunOrmEntity } from '@/workflow/entities/workflow-run.entity';
import { WorkflowVersionOrmEntity } from '@/workflow/entities/workflow-version.entity';
import { WorkflowOrmEntity } from '@/workflow/entities/workflow.entity';
import {
  ManualEventWrapper,
  ScheduledEventWrapper,
} from '@/workflow/lib/trigger-event-wrapper';
import { parseWorkflowDefinition } from '@/workflow/lib/workflow-definition';
import { AgenticService } from '@/workflow/services/agentic.service';
import { McpServerService } from '@/workflow/services/mcp-server.service';
import { MemoryDefinitionService } from '@/workflow/services/memory-definition.service';
import { WorkflowRunService } from '@/workflow/services/workflow-run.service';
import { WorkflowVersionService } from '@/workflow/services/workflow-version.service';
import { WorkflowService } from '@/workflow/services/workflow.service';
import {
  DirectionType,
  McpServerTransport,
  MemoryScope,
  WorkflowType,
  WorkflowVersionAction,
} from '@/workflow/types';

import { McpPermission } from '../decorators/mcp-permission.decorator';
import { McpPermissionGuard } from '../guards/mcp-permission.guard';
import { HexabotMcpRequest } from '../types';

const uuidSchema = z.string().uuid();
const jsonObjectSchema = z.record(z.string(), z.unknown());
const paginationSchema = {
  limit: z.number().int().min(1).max(100).default(20),
  skip: z.number().int().min(0).default(0),
  sortBy: z.string().default('createdAt'),
  sortDirection: z.enum(['ASC', 'DESC']).default('DESC'),
};
const workflowPayloadSchema = {
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(WorkflowType).optional(),
  schedule: z.string().nullable().optional(),
  inputSchema: jsonObjectSchema.optional(),
  builtin: z.boolean().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
  zoom: z.number().optional(),
  direction: z.enum(DirectionType).optional(),
};
const mcpServerPayloadSchema = {
  name: z.string().min(1).optional(),
  enabled: z.boolean().optional(),
  transport: z.enum(McpServerTransport).optional(),
  url: z.string().nullable().optional(),
  command: z.string().nullable().optional(),
  args: z.array(z.string()).nullable().optional(),
  cwd: z.string().nullable().optional(),
  credential: uuidSchema.nullable().optional(),
};

type PaginationArgs = {
  limit: number;
  skip: number;
  sortBy: string;
  sortDirection: 'ASC' | 'DESC';
};

@Injectable()
export class HexabotMcpTools {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly workflowVersionService: WorkflowVersionService,
    private readonly workflowRunService: WorkflowRunService,
    private readonly agenticService: AgenticService,
    private readonly memoryDefinitionService: MemoryDefinitionService,
    private readonly actionService: ActionService,
    private readonly runtimeBindingsService: RuntimeBindingsService,
    private readonly credentialService: CredentialService,
    private readonly contentTypeService: ContentTypeService,
    private readonly contentService: ContentService,
    private readonly mcpServerService: McpServerService,
  ) {}

  @McpPermission('workflow', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_search',
    description: 'Search Hexabot workflows by metadata.',
    parameters: z.object({
      query: z.string().optional(),
      type: z.enum(WorkflowType).optional(),
      createdById: uuidSchema.optional(),
      ...paginationSchema,
    }),
  })
  async searchWorkflows(
    args: {
      query?: string;
      type?: WorkflowType;
      createdById?: string;
    } & PaginationArgs,
  ) {
    const where = this.buildWorkflowWhere(args);
    const options = this.findOptions<WorkflowOrmEntity>(args, where);

    return await this.listWithCount(this.workflowService, options);
  }

  @McpPermission('workflow', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_get',
    description: 'Read a Hexabot workflow with populated version metadata.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async getWorkflow(args: { id: string }) {
    return await this.requireWorkflow(args.id);
  }

  @McpPermission('workflow', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_create',
    description:
      'Create a Hexabot workflow. Optionally commit an initial workflow definition YAML.',
    parameters: z.object({
      ...workflowPayloadSchema,
      name: z.string().min(1),
      definitionYml: z.string().optional(),
      versionMessage: z.string().optional(),
    }),
  })
  async createWorkflow(
    args: {
      name: string;
      description?: string;
      type?: WorkflowType;
      schedule?: string | null;
      inputSchema?: Record<string, unknown>;
      builtin?: boolean;
      x?: number;
      y?: number;
      zoom?: number;
      direction?: DirectionType;
      definitionYml?: string;
      versionMessage?: string;
    },
    _context: unknown,
    request?: HexabotMcpRequest,
  ) {
    const actorId = this.getActorId(request);
    const { definitionYml, versionMessage, ...workflowPayload } = args;
    const workflow = await this.workflowService.create({
      ...workflowPayload,
      createdBy: actorId,
    });

    if (definitionYml) {
      await this.commitWorkflowDefinition({
        workflowId: workflow.id,
        definitionYml,
        message: versionMessage,
        action: WorkflowVersionAction.update,
        createdBy: actorId,
      });
    }

    return await this.requireWorkflow(workflow.id);
  }

  @McpPermission('workflow', Action.UPDATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_update',
    description:
      'Update workflow metadata. Optionally commit a new workflow definition YAML version.',
    parameters: z.object({
      id: uuidSchema,
      ...workflowPayloadSchema,
      definitionYml: z.string().optional(),
      versionMessage: z.string().optional(),
    }),
  })
  async updateWorkflow(
    args: {
      id: string;
      definitionYml?: string;
      versionMessage?: string;
    } & Record<string, unknown>,
    _context: unknown,
    request?: HexabotMcpRequest,
  ) {
    const actorId = this.getActorId(request);
    const { id, definitionYml, versionMessage, ...updates } = args;
    await this.requireWorkflow(id);

    if (Object.keys(updates).length > 0) {
      await this.workflowService.updateOne(id, updates as any);
    }

    if (definitionYml) {
      await this.commitWorkflowDefinition({
        workflowId: id,
        definitionYml,
        message: versionMessage,
        action: WorkflowVersionAction.update,
        createdBy: actorId,
      });
    }

    return await this.requireWorkflow(id);
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

    return await this.commitWorkflowDefinition({
      ...args,
      createdBy: actorId,
    });
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
    return await this.workflowVersionService.restoreVersion(
      args.workflowId,
      args.versionId,
      {
        updatedBy: this.getActorId(request),
        message: args.message,
      },
    );
  }

  @McpPermission('workflow', Action.UPDATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_publish',
    description: 'Publish the current workflow version.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async publishWorkflow(args: { id: string }) {
    const workflow = await this.workflowService.findOne(args.id);
    if (!workflow) {
      throw new NotFoundException(`Workflow ${args.id} not found`);
    }
    if (!workflow.currentVersion) {
      throw new BadRequestException(
        'Workflow must have a current version to be published',
      );
    }

    await this.workflowService.updateOne(args.id, {
      publishedVersion: workflow.currentVersion,
    });

    return await this.requireWorkflow(args.id);
  }

  @McpPermission('workflow', Action.UPDATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_unpublish',
    description: 'Clear the published workflow version.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async unpublishWorkflow(args: { id: string }) {
    await this.requireWorkflow(args.id);
    await this.workflowService.updateOne(args.id, { publishedVersion: null });

    return await this.requireWorkflow(args.id);
  }

  @McpPermission('workflowrun', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_run',
    description:
      'Run a manual or scheduled workflow and return the run summary.',
    parameters: z.object({
      workflowId: uuidSchema,
      input: jsonObjectSchema.default({}),
    }),
  })
  async runWorkflow(
    args: { workflowId: string; input: Record<string, unknown> },
    _context: unknown,
    request?: HexabotMcpRequest,
  ) {
    const actor = this.getActor(request);
    const workflow = await this.workflowService.findOne(args.workflowId);
    if (!workflow) {
      throw new NotFoundException(`Workflow ${args.workflowId} not found`);
    }

    if (
      workflow.type !== WorkflowType.manual &&
      workflow.type !== WorkflowType.scheduled
    ) {
      throw new BadRequestException(
        'Workflow must be manual or scheduled to run manually',
      );
    }

    const event =
      workflow.type === WorkflowType.scheduled
        ? new ScheduledEventWrapper({
            schedule: workflow.schedule ?? null,
            triggeredAt: new Date(),
          })
        : new ManualEventWrapper(
            this.workflowService.validateManualInput(
              args.input ?? {},
              workflow.inputSchema,
            ),
            actor.id,
          );
    event.setInitiator(actor);
    event.setWorkflowId(workflow.id);

    const run = await this.agenticService.handleEvent(event);

    return { accepted: true, run };
  }

  @McpPermission('workflowrun', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_run_search',
    description: 'Search workflow runs by workflow and status.',
    parameters: z.object({
      workflowId: uuidSchema.optional(),
      status: z.string().optional(),
      ...paginationSchema,
    }),
  })
  async searchWorkflowRuns(
    args: { workflowId?: string; status?: string } & PaginationArgs,
  ) {
    const where = {
      ...(args.workflowId ? { workflow: { id: args.workflowId } } : {}),
      ...(args.status ? { status: args.status } : {}),
    } as any;

    return await this.listWithCount(
      this.workflowRunService,
      this.findOptions<WorkflowRunOrmEntity>(args, where),
    );
  }

  @McpPermission('workflowrun', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_workflow_run_get',
    description: 'Read one workflow run with populated workflow metadata.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async getWorkflowRun(args: { id: string }) {
    const run = await this.workflowRunService.findOneAndPopulate(args.id);
    if (!run) {
      throw new NotFoundException(`Workflow run ${args.id} not found`);
    }

    return run;
  }

  @McpPermission('memorydefinition', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_memory_definition_search',
    description: 'Search workflow memory definitions.',
    parameters: z.object({
      query: z.string().optional(),
      scope: z.enum(MemoryScope).optional(),
      ...paginationSchema,
    }),
  })
  async searchMemoryDefinitions(
    args: { query?: string; scope?: MemoryScope } & PaginationArgs,
  ) {
    const base = args.scope ? { scope: args.scope } : {};
    const where = args.query
      ? [
          { ...base, name: this.contains(args.query) },
          { ...base, slug: this.contains(args.query) },
        ]
      : base;

    return await this.listWithCount(
      this.memoryDefinitionService,
      this.findOptions(args, where),
    );
  }

  @McpPermission('memorydefinition', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_memory_definition_get',
    description: 'Read one workflow memory definition.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async getMemoryDefinition(args: { id: string }) {
    const definition = await this.memoryDefinitionService.findOne(args.id);
    if (!definition) {
      throw new NotFoundException(`Memory definition ${args.id} not found`);
    }

    return definition;
  }

  @McpPermission('memorydefinition', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_memory_definition_create',
    description: 'Create a workflow memory definition.',
    parameters: z.object({
      name: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9_]+$/),
      scope: z.enum(MemoryScope),
      schema: jsonObjectSchema,
      ttlSeconds: z.number().int().min(1).nullable().optional(),
    }),
  })
  async createMemoryDefinition(args: {
    name: string;
    slug: string;
    scope: MemoryScope;
    schema: Record<string, unknown>;
    ttlSeconds?: number | null;
  }) {
    return await this.memoryDefinitionService.create(args as any);
  }

  @McpPermission('memorydefinition', Action.UPDATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_memory_definition_update',
    description: 'Update a workflow memory definition.',
    parameters: z.object({
      id: uuidSchema,
      name: z.string().min(1).optional(),
      slug: z
        .string()
        .regex(/^[a-z0-9_]+$/)
        .optional(),
      scope: z.enum(MemoryScope).optional(),
      schema: jsonObjectSchema.optional(),
      ttlSeconds: z.number().int().min(1).nullable().optional(),
    }),
  })
  async updateMemoryDefinition(args: { id: string } & Record<string, unknown>) {
    const { id, ...updates } = args;

    return await this.memoryDefinitionService.updateOne(id, updates as any);
  }

  @McpPermission('workflow', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_action_search',
    description: 'Search available workflow actions and their schemas.',
    parameters: z.object({
      query: z.string().optional(),
      workflowType: z.enum(WorkflowType).optional(),
    }),
  })
  async searchActions(args: { query?: string; workflowType?: WorkflowType }) {
    const query = args.query?.toLowerCase();
    const actions = this.actionService.getAllSchemaDefinitions(
      args.workflowType,
    );

    return {
      items: query
        ? actions.filter((action) =>
            [
              action.name,
              action.description,
              action.group,
              ...(action.workflowTypes ?? []),
            ]
              .filter(Boolean)
              .some((value) => `${value}`.toLowerCase().includes(query)),
          )
        : actions,
    };
  }

  @McpPermission('workflow', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_action_get',
    description: 'Read schema metadata for one workflow action.',
    parameters: z.object({
      name: z.string().min(1),
    }),
  })
  async getAction(args: { name: string }) {
    const action = this.actionService
      .getAllSchemaDefinitions()
      .find((entry) => entry.name === args.name);
    if (!action) {
      throw new NotFoundException(`Action ${args.name} not found`);
    }

    return action;
  }

  @McpPermission('workflow', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_binding_search',
    description: 'Search workflow runtime binding kind schemas.',
    parameters: z.object({
      query: z.string().optional(),
    }),
  })
  async searchBindings(args: { query?: string }) {
    const query = args.query?.toLowerCase();
    const entries = Object.entries(
      this.runtimeBindingsService.getAllSchemaDefinitions(),
    ).map(([kind, definition]) => ({ kind, ...definition }));

    return {
      items: query
        ? entries.filter((entry) =>
            [entry.kind, entry.icon, entry.color]
              .filter(Boolean)
              .some((value) => `${value}`.toLowerCase().includes(query)),
          )
        : entries,
    };
  }

  @McpPermission('workflow', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_binding_get',
    description: 'Read schema metadata for one workflow runtime binding kind.',
    parameters: z.object({
      kind: z.string().min(1),
    }),
  })
  async getBinding(args: { kind: string }) {
    const bindings = this.runtimeBindingsService.getAllSchemaDefinitions();
    const binding = bindings[args.kind];
    if (!binding) {
      throw new NotFoundException(`Binding kind ${args.kind} not found`);
    }

    return { kind: args.kind, ...binding };
  }

  @McpPermission('credential', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_credential_search',
    description:
      'Search credentials by metadata only. Secret credential values are never returned.',
    parameters: z.object({
      query: z.string().optional(),
      ownerId: uuidSchema.optional(),
      ...paginationSchema,
    }),
  })
  async searchCredentials(
    args: { query?: string; ownerId?: string } & PaginationArgs,
  ) {
    const where = {
      ...(args.ownerId ? { owner: { id: args.ownerId } } : {}),
      ...(args.query ? { name: this.contains(args.query) } : {}),
    } as any;
    const result = await this.listWithCount(
      this.credentialService,
      this.findOptions(args, where),
    );

    return {
      ...result,
      items: result.items.map(HexabotMcpTools.sanitizeCredential),
    };
  }

  @McpPermission('credential', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_credential_get',
    description:
      'Read credential metadata. Secret credential values are never returned.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async getCredential(args: { id: string }) {
    const credential = await this.credentialService.findOneAndPopulate(args.id);
    if (!credential) {
      throw new NotFoundException(`Credential ${args.id} not found`);
    }

    return HexabotMcpTools.sanitizeCredential(credential);
  }

  @McpPermission('mcpserver', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_mcp_server_search',
    description: 'Search configured MCP servers.',
    parameters: z.object({
      query: z.string().optional(),
      enabled: z.boolean().optional(),
      transport: z.enum(McpServerTransport).optional(),
      credentialId: uuidSchema.optional(),
      ...paginationSchema,
    }),
  })
  async searchMcpServers(
    args: {
      query?: string;
      enabled?: boolean;
      transport?: McpServerTransport;
      credentialId?: string;
    } & PaginationArgs,
  ) {
    const base = {
      ...(args.enabled !== undefined ? { enabled: args.enabled } : {}),
      ...(args.transport ? { transport: args.transport } : {}),
      ...(args.credentialId ? { credential: { id: args.credentialId } } : {}),
    };
    const where = args.query
      ? [
          { ...base, name: this.contains(args.query) },
          { ...base, url: this.contains(args.query) },
          { ...base, command: this.contains(args.query) },
        ]
      : base;

    return await this.listWithCount(
      this.mcpServerService,
      this.findOptions<McpServerOrmEntity>(args, where as any),
    );
  }

  @McpPermission('mcpserver', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_mcp_server_get',
    description: 'Read one configured MCP server.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async getMcpServer(args: { id: string }) {
    const server = await this.mcpServerService.findOneAndPopulate(args.id);
    if (!server) {
      throw new NotFoundException(`MCP server ${args.id} not found`);
    }

    return server;
  }

  @McpPermission('mcpserver', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_mcp_server_create',
    description: 'Create an MCP server configuration.',
    parameters: z.object({
      ...mcpServerPayloadSchema,
      name: z.string().min(1),
    }),
  })
  async createMcpServer(args: {
    name: string;
    enabled?: boolean;
    transport?: McpServerTransport;
    url?: string | null;
    command?: string | null;
    args?: string[] | null;
    cwd?: string | null;
    credential?: string | null;
  }) {
    return await this.mcpServerService.create({
      enabled: true,
      transport: McpServerTransport.http,
      ...args,
    } as any);
  }

  @McpPermission('mcpserver', Action.UPDATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_mcp_server_update',
    description: 'Update an MCP server configuration.',
    parameters: z.object({
      id: uuidSchema,
      ...mcpServerPayloadSchema,
    }),
  })
  async updateMcpServer(args: { id: string } & Record<string, unknown>) {
    const { id, ...updates } = args;

    await this.getMcpServer({ id });

    return await this.mcpServerService.updateOne(id, updates as any);
  }

  @McpPermission('contenttype', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_content_type_search',
    description: 'Search CMS content types.',
    parameters: z.object({
      query: z.string().optional(),
      ...paginationSchema,
    }),
  })
  async searchContentTypes(args: { query?: string } & PaginationArgs) {
    const where = args.query ? { name: this.contains(args.query) } : {};

    return await this.listWithCount(
      this.contentTypeService,
      this.findOptions<ContentTypeOrmEntity>(args, where),
    );
  }

  @McpPermission('contenttype', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_content_type_get',
    description: 'Read one CMS content type.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async getContentType(args: { id: string }) {
    const contentType = await this.contentTypeService.findOne(args.id);
    if (!contentType) {
      throw new NotFoundException(`Content type ${args.id} not found`);
    }

    return contentType;
  }

  @McpPermission('contenttype', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_content_type_create',
    description: 'Create a CMS content type.',
    parameters: z.object({
      name: z.string().min(1),
      schema: jsonObjectSchema,
    }),
  })
  async createContentType(args: {
    name: string;
    schema: Record<string, unknown>;
  }) {
    return await this.contentTypeService.create(args as any);
  }

  @McpPermission('contenttype', Action.UPDATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_content_type_update',
    description: 'Update a CMS content type.',
    parameters: z.object({
      id: uuidSchema,
      name: z.string().min(1).optional(),
      schema: jsonObjectSchema.optional(),
    }),
  })
  async updateContentType(args: { id: string } & Record<string, unknown>) {
    const { id, ...updates } = args;

    return await this.contentTypeService.updateOne(id, updates as any);
  }

  @McpPermission('content', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_content_search',
    description: 'Search CMS content records.',
    parameters: z.object({
      query: z.string().optional(),
      contentTypeId: uuidSchema.optional(),
      status: z.boolean().optional(),
      ...paginationSchema,
    }),
  })
  async searchContent(
    args: {
      query?: string;
      contentTypeId?: string;
      status?: boolean;
    } & PaginationArgs,
  ) {
    if (args.query) {
      return {
        items: await this.contentService.textSearch(args.query, {
          status: args.status,
          contentTypeId: args.contentTypeId,
          limit: args.limit,
        }),
        limit: args.limit,
        skip: 0,
      };
    }

    const where = {
      ...(args.contentTypeId
        ? { contentType: { id: args.contentTypeId } }
        : {}),
      ...(args.status !== undefined ? { status: args.status } : {}),
    } as any;

    return await this.listWithCount(
      this.contentService,
      this.findOptions<ContentOrmEntity>(args, where),
    );
  }

  @McpPermission('content', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_content_get',
    description: 'Read one CMS content record.',
    parameters: z.object({
      id: uuidSchema,
    }),
  })
  async getContent(args: { id: string }) {
    const content = await this.contentService.findOneAndPopulate(args.id);
    if (!content) {
      throw new NotFoundException(`Content ${args.id} not found`);
    }

    return content;
  }

  @McpPermission('content', Action.CREATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_content_create',
    description: 'Create a CMS content record.',
    parameters: z.object({
      contentType: uuidSchema,
      title: z.string().min(1),
      status: z.boolean().optional(),
      properties: jsonObjectSchema.optional(),
    }),
  })
  async createContent(args: {
    contentType: string;
    title: string;
    status?: boolean;
    properties?: Record<string, unknown>;
  }) {
    return await this.contentService.create(args as any);
  }

  @McpPermission('content', Action.UPDATE)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_content_update',
    description: 'Update a CMS content record.',
    parameters: z.object({
      id: uuidSchema,
      contentType: uuidSchema.optional(),
      title: z.string().min(1).optional(),
      status: z.boolean().optional(),
      properties: jsonObjectSchema.optional(),
    }),
  })
  async updateContent(args: { id: string } & Record<string, unknown>) {
    const { id, ...updates } = args;

    return await this.contentService.updateOne(id, updates as any);
  }

  @McpPermission('content', Action.READ)
  @ToolGuards([McpPermissionGuard])
  @Tool({
    name: 'hexabot_rag_content_search',
    description: 'Search indexed CMS content through Hexabot RAG retrieval.',
    parameters: z.object({
      query: z.string().min(1),
      mode: z.enum(['embedding', 'lexical']).optional(),
      limit: z.number().int().min(1).max(50).default(10),
      contentTypeId: uuidSchema.optional(),
      includeInactive: z.boolean().optional(),
    }),
  })
  async searchRagContent(args: {
    query: string;
    mode?: 'embedding' | 'lexical';
    limit: number;
    contentTypeId?: string;
    includeInactive?: boolean;
  }) {
    return {
      items: await this.contentService.retrieve(args.query, {
        mode: args.mode,
        limit: args.limit,
        contentTypeId: args.contentTypeId,
        includeInactive: args.includeInactive,
      }),
    };
  }

  static sanitizeCredential<T extends Record<string, unknown>>(
    credential: T,
  ): T {
    const { value: _value, ...safeCredential } = credential;

    return safeCredential as T;
  }

  private buildWorkflowWhere(args: {
    query?: string;
    type?: WorkflowType;
    createdById?: string;
  }) {
    const base = {
      ...(args.type ? { type: args.type } : {}),
      ...(args.createdById ? { createdBy: { id: args.createdById } } : {}),
    };

    return args.query
      ? [
          { ...base, name: this.contains(args.query) },
          { ...base, description: this.contains(args.query) },
        ]
      : base;
  }

  private async requireWorkflow(id: string) {
    const workflow = await this.workflowService.findOneAndPopulate(id);
    if (!workflow) {
      throw new NotFoundException(`Workflow ${id} not found`);
    }

    return workflow;
  }

  private async commitWorkflowDefinition(params: {
    workflowId: string;
    definitionYml: string;
    message?: string | null;
    parentVersion?: string | null;
    action?: WorkflowVersionAction;
    createdBy: string;
  }) {
    await this.requireWorkflow(params.workflowId);
    try {
      parseWorkflowDefinition(params.definitionYml);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid workflow YAML',
      );
    }

    const payload: WorkflowNewVersionDto = {
      workflow: params.workflowId,
      definitionYml: params.definitionYml,
      message: params.message ?? undefined,
      parentVersion: params.parentVersion ?? undefined,
      action: params.action ?? WorkflowVersionAction.update,
      createdBy: params.createdBy,
    };

    return await this.workflowVersionService.commit(payload);
  }

  private findOptions<Entity>(
    args: PaginationArgs,
    where: FindManyOptions<Entity>['where'],
  ): FindManyOptions<Entity> {
    return {
      where,
      take: args.limit,
      skip: args.skip,
      order: { [args.sortBy]: args.sortDirection } as any,
    };
  }

  private async listWithCount<Entity>(
    service: {
      findAndPopulate(options?: FindManyOptions<Entity>): Promise<unknown[]>;
      count(options?: FindManyOptions<Entity>): Promise<number>;
    },
    options: FindManyOptions<Entity>,
  ) {
    const [items, total] = await Promise.all([
      service.findAndPopulate(options),
      service.count({ where: options.where }),
    ]);

    return {
      items,
      total,
      limit: options.take,
      skip: options.skip,
    };
  }

  private contains(value: string) {
    return Like(`%${value}%`);
  }

  private getActor(request?: HexabotMcpRequest): User {
    const actor = request?.hexabotUser ?? request?.user;
    if (!actor?.id) {
      throw new UnauthorizedException('MCP Hexabot user is required');
    }

    return actor as User;
  }

  private getActorId(request?: HexabotMcpRequest): string {
    return this.getActor(request).id;
  }
}
