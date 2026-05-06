/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  WORKFLOW_EXPORT_BUNDLE_KIND,
  type WorkflowExportBundle,
} from '@hexabot-ai/types';
import { BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { ContentTypeOrmEntity } from '@/cms/entities/content-type.entity';
import { CredentialOrmEntity } from '@/user/entities/credential.entity';

import { McpServerTransport, MemoryScope, WorkflowType } from '../../types';
import { McpServerService } from '../mcp-server.service';
import { MemoryDefinitionService } from '../memory-definition.service';

import { WorkflowTransferResourceService } from './workflow-transfer-resource.service';

describe('WorkflowTransferResourceService', () => {
  const createService = ({
    contentTypes = [],
    credentials = [],
    labels = [],
    memoryDefinitions = [],
    mcpServers = [],
  }: {
    contentTypes?: Array<Record<string, unknown>>;
    credentials?: Array<Record<string, unknown>>;
    labels?: Array<Record<string, unknown>>;
    memoryDefinitions?: Array<Record<string, unknown>>;
    mcpServers?: Array<Record<string, unknown>>;
  } = {}) => {
    const contentTypeRepository = {
      find: jest.fn().mockResolvedValue(contentTypes),
    };
    const labelRepository = {
      find: jest.fn().mockResolvedValue(labels),
    };
    const credentialRepository = {
      find: jest.fn().mockResolvedValue(credentials),
    };
    const dataSource = {
      getRepository: jest.fn((entity) => {
        if (entity === ContentTypeOrmEntity) {
          return contentTypeRepository;
        }
        if (entity === CredentialOrmEntity) {
          return credentialRepository;
        }
        if (entity === LabelOrmEntity) {
          return labelRepository;
        }

        throw new Error('Unexpected repository');
      }),
    } as unknown as DataSource;
    const memoryDefinitionService = {
      find: jest.fn().mockResolvedValue(memoryDefinitions),
    } as unknown as MemoryDefinitionService;
    const mcpServerService = {
      findAndPopulate: jest.fn().mockResolvedValue(mcpServers),
    } as unknown as McpServerService;

    return {
      service: new WorkflowTransferResourceService(
        dataSource,
        memoryDefinitionService,
        mcpServerService,
      ),
      contentTypeRepository,
      credentialRepository,
      labelRepository,
      memoryDefinitionService,
      mcpServerService,
    };
  };
  const emptyTaskRefs = {
    contentTypes: [],
    credentials: [],
    labels: [],
    mcpServers: [],
    memoryDefinitions: [],
  };
  const createBundle = (
    resources: Partial<WorkflowExportBundle['resources']> = {},
  ) =>
    ({
      kind: WORKFLOW_EXPORT_BUNDLE_KIND,
      schemaVersion: 1,
      exportedAt: '2026-05-05T00:00:00.000Z',
      workflow: {
        name: 'Workflow',
        description: null,
        type: WorkflowType.conversational,
        schedule: null,
        inputSchema: {},
        layout: {
          x: 0,
          y: 0,
          zoom: 1,
          direction: 'horizontal',
        },
      },
      version: {
        number: 1,
        checksum: 'checksum',
        message: null,
        exportedVersionId: 'version-export-id',
      },
      definitionYml: 'defs: {}\nflow: []\noutputs: {}\n',
      resources: {
        memoryDefinitions: [],
        mcpServers: [],
        credentials: [],
        contentTypes: [],
        labelGroups: [],
        labels: [],
        ...resources,
      },
    }) as WorkflowExportBundle;

  it('builds export resource payloads and strips credential secret values', async () => {
    const { service, memoryDefinitionService, mcpServerService } =
      createService({
        memoryDefinitions: [
          {
            id: 'memory-id',
            name: 'Profile',
            slug: 'profile',
            scope: MemoryScope.workflow,
            schema: { type: 'object' },
            ttlSeconds: null,
          },
        ],
        mcpServers: [
          {
            id: 'mcp-id',
            name: 'Search MCP',
            enabled: true,
            transport: McpServerTransport.http,
            url: 'https://mcp.example.com',
            command: null,
            args: null,
            cwd: null,
            credential: {
              id: 'credential-id',
              name: 'Search credential',
              owner: 'owner-id',
              value: 'secret',
            },
          },
        ],
        contentTypes: [
          {
            id: 'content-type-id',
            name: 'Article',
            schema: { type: 'object' },
          },
        ],
        credentials: [
          {
            id: 'direct-credential-id',
            name: 'Direct credential',
            owner: { id: 'direct-owner-id' },
            value: 'direct-secret',
          },
        ],
        labels: [
          {
            id: 'label-id',
            title: 'Qualified',
            name: 'QUALIFIED',
            description: null,
            group: { id: 'label-group-id', name: 'Lead status' },
          },
        ],
      });
    const resources = await service.buildExportResources(
      {
        ...emptyTaskRefs,
        contentTypes: ['content-type-id'],
        credentials: ['direct-credential-id'],
        labels: ['label-id'],
        mcpServers: ['mcp-id'],
        memoryDefinitions: ['memory-id', 'memory-id'],
      },
      emptyTaskRefs,
    );

    expect(memoryDefinitionService.find).toHaveBeenCalledTimes(1);
    expect(mcpServerService.findAndPopulate).toHaveBeenCalledTimes(1);
    expect(resources).toEqual({
      memoryDefinitions: [
        {
          exportId: 'memory-id',
          name: 'Profile',
          slug: 'profile',
          scope: MemoryScope.workflow,
          schema: { type: 'object' },
          ttlSeconds: null,
        },
      ],
      mcpServers: [
        {
          exportId: 'mcp-id',
          name: 'Search MCP',
          enabled: true,
          transport: McpServerTransport.http,
          url: 'https://mcp.example.com',
          command: null,
          args: null,
          cwd: null,
          credentialExportId: 'credential-id',
        },
      ],
      credentials: [
        {
          exportId: 'direct-credential-id',
          name: 'Direct credential',
          exportedOwnerId: 'direct-owner-id',
        },
        {
          exportId: 'credential-id',
          name: 'Search credential',
          exportedOwnerId: 'owner-id',
        },
      ],
      contentTypes: [
        {
          exportId: 'content-type-id',
          name: 'Article',
          schema: { type: 'object' },
        },
      ],
      labelGroups: [
        {
          exportId: 'label-group-id',
          name: 'Lead status',
        },
      ],
      labels: [
        {
          exportId: 'label-id',
          title: 'Qualified',
          name: 'QUALIFIED',
          description: null,
          groupExportId: 'label-group-id',
        },
      ],
    });
    expect(JSON.stringify(resources)).not.toContain('secret');
    expect(JSON.stringify(resources)).not.toContain('direct-secret');
  });

  it('rejects bundle resources that omit referenced ids', () => {
    const { service } = createService();
    const bundle = createBundle({
      contentTypes: [
        { exportId: 'content-type-id', name: 'Article', schema: {} },
      ],
      labels: [
        {
          exportId: 'label-id',
          title: 'Qualified',
          name: 'QUALIFIED',
          description: null,
          groupExportId: 'missing-group-id',
        },
      ],
    });

    expect(() =>
      service.assertBundleContainsReferencedResources(bundle, emptyTaskRefs, {
        ...emptyTaskRefs,
        contentTypes: ['content-type-id'],
        labels: ['label-id'],
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects bundle resources that omit binding-referenced ids', () => {
    const { service } = createService();

    expect(() =>
      service.assertBundleContainsReferencedResources(
        createBundle(),
        {
          ...emptyTaskRefs,
          contentTypes: ['missing-content-type-id'],
        },
        emptyTaskRefs,
      ),
    ).toThrow(BadRequestException);

    expect(() =>
      service.assertBundleContainsReferencedResources(
        createBundle({
          contentTypes: [
            { exportId: 'content-type-id', name: 'Article', schema: {} },
          ],
        }),
        {
          ...emptyTaskRefs,
          contentTypes: ['content-type-id'],
          labels: ['missing-label-id'],
        },
        emptyTaskRefs,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects MCP servers that reference credentials absent from the bundle', async () => {
    const { service } = createService();
    const manager = {
      findOne: jest.fn().mockResolvedValue(null),
    } as unknown as EntityManager;

    await expect(
      service.importResources(
        manager,
        createBundle({
          mcpServers: [
            {
              exportId: 'mcp-id',
              name: 'Search MCP',
              enabled: true,
              transport: McpServerTransport.http,
              url: 'https://mcp.example.com',
              command: null,
              args: null,
              cwd: null,
              credentialExportId: 'missing-credential-id',
            },
          ],
        }).resources,
        'owner-id',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
