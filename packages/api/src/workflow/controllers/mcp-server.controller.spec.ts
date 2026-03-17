/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { In } from 'typeorm';

import { LoggerService } from '@/logger/logger.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import {
  installMcpServerFixturesTypeOrm,
  mcpServerFixtureIds,
  mcpServerOrmFixtures,
} from '@/utils/test/fixtures/mcp-server';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { McpClientPoolService } from '../services/mcp-client-pool.service';
import { McpServerService } from '../services/mcp-server.service';
import { McpServerTransport } from '../types';

import { McpServerController } from './mcp-server.controller';

describe('McpServerController (TypeORM)', () => {
  let module: TestingModule;
  let controller: McpServerController;
  let service: McpServerService;
  let mcpClientPoolService: McpClientPoolService;
  let logger: LoggerService;
  const createdIds = new Set<string>();
  let counter = 0;

  const buildPayload = () => {
    counter += 1;

    return {
      name: `MCP Server ${counter}`,
      enabled: true,
      transport: McpServerTransport.http,
      url: `https://mcp.example.com/${counter}`,
      credential: null,
    };
  };

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [McpServerController],
      providers: [
        {
          provide: McpClientPoolService,
          useValue: {
            testServer: jest.fn(),
            listToolsForDiagnostics: jest.fn(),
          },
        },
      ],
      typeorm: {
        fixtures: installMcpServerFixturesTypeOrm,
      },
    });
    module = testingModule;
    [controller, service, mcpClientPoolService] = await getMocks([
      McpServerController,
      McpServerService,
      McpClientPoolService,
    ]);
    logger = controller.logger;
  });

  afterEach(async () => {
    jest.clearAllMocks();
    for (const id of Array.from(createdIds)) {
      await service.deleteOne(id);
      createdIds.delete(id);
    }
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('create', () => {
    it('creates an MCP server', async () => {
      const payload = buildPayload();
      const createSpy = jest.spyOn(service, 'create');
      const created = await controller.create(payload);
      createdIds.add(created.id);

      expect(createSpy).toHaveBeenCalledWith(payload);
      expect(created).toEqualPayload(payload, [...IGNORED_TEST_FIELDS]);
    });
  });

  describe('find', () => {
    it('returns MCP servers matching provided filters', async () => {
      const [fixture] = mcpServerOrmFixtures;
      const options = { where: { name: fixture.name } };
      const findSpy = jest.spyOn(service, 'findAndPopulate');
      const result = await controller.find(['credential'], options);

      expect(findSpy).toHaveBeenCalledWith(options);
      expect(result).toEqualPayload([fixture], [...IGNORED_TEST_FIELDS]);
    });
  });

  describe('filterCount', () => {
    it('returns filtered count', async () => {
      const result = await controller.filterCount({
        where: { enabled: true },
      });

      expect(result).toEqual({ count: 1 });
    });
  });

  describe('findOne', () => {
    it('returns an MCP server when it exists', async () => {
      const id = mcpServerFixtureIds.enabled;
      const findSpy = jest.spyOn(service, 'findOneAndPopulate');
      const result = await controller.findOne(id, ['credential']);

      expect(findSpy).toHaveBeenCalledWith(id);
      expect(result).toEqualPayload(mcpServerOrmFixtures[0], [
        ...IGNORED_TEST_FIELDS,
      ]);
    });

    it('throws NotFoundException when MCP server is missing', async () => {
      const id = randomUUID();
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(controller.findOne(id, [])).rejects.toThrow(
        new NotFoundException(`MCP server with ID ${id} not found`),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        `Unable to find MCP server by id ${id}`,
      );
    });
  });

  describe('updateOne', () => {
    it('updates an existing MCP server', async () => {
      const created = await service.create(buildPayload());
      createdIds.add(created.id);
      const updates = {
        enabled: false,
        url: 'https://mcp.example.com/updated',
      };
      const updateSpy = jest.spyOn(service, 'updateOne');
      const result = await controller.updateOne(created.id, updates);

      expect(updateSpy).toHaveBeenCalledWith(created.id, updates);
      expect(result).toEqualPayload({ ...created, ...updates }, [
        ...IGNORED_TEST_FIELDS,
      ]);
    });

    it('throws NotFoundException when updating a missing server', async () => {
      const id = randomUUID();
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(
        controller.updateOne(id, { enabled: false }),
      ).rejects.toThrow(
        new NotFoundException(`MCP server with ID ${id} not found`),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        `Unable to update MCP server by id ${id}`,
      );
    });
  });

  describe('deleteOne', () => {
    it('removes an existing MCP server', async () => {
      const created = await service.create(buildPayload());
      createdIds.add(created.id);
      const deleteSpy = jest.spyOn(service, 'deleteOne');
      const result = await controller.deleteOne(created.id);

      expect(deleteSpy).toHaveBeenCalledWith(created.id);
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });
      expect(await service.findOne(created.id)).toBeNull();
    });

    it('throws NotFoundException when deleting a missing server', async () => {
      const id = randomUUID();
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(controller.deleteOne(id)).rejects.toThrow(
        new NotFoundException(`MCP server with ID ${id} not found`),
      );
      expect(warnSpy).toHaveBeenCalledWith(
        `Unable to delete MCP server by id ${id}`,
      );
    });

    it('deletes multiple created servers using service-level filters', async () => {
      const created = await service.createMany([
        buildPayload(),
        buildPayload(),
      ]);
      const ids = created.map(({ id }) => id);
      ids.forEach((id) => createdIds.add(id));

      const result = await service.deleteMany({ where: { id: In(ids) } });
      ids.forEach((id) => createdIds.delete(id));

      expect(result).toEqualPayload({
        acknowledged: true,
        deletedCount: ids.length,
      });
    });
  });

  describe('test', () => {
    it('returns rich diagnostics payload', async () => {
      const id = mcpServerFixtureIds.disabled;
      const payload = {
        ok: true,
        checkedAt: new Date().toISOString(),
        latencyMs: 12,
        server: {
          id,
          name: 'Diagnostics MCP Server',
          enabled: false,
          transport: McpServerTransport.http,
          url: 'https://mcp.example.com/disabled',
        },
        toolCount: 2,
        sampledToolNames: ['calculator', 'search'],
        meta: { version: '1.0.0' },
      };
      jest
        .spyOn(mcpClientPoolService, 'testServer')
        .mockResolvedValue(payload as any);

      const result = await controller.test(id);

      expect(mcpClientPoolService.testServer).toHaveBeenCalledWith(id);
      expect(result).toEqualPayload(payload);
    });
  });

  describe('tools', () => {
    it('returns normalized tools list', async () => {
      const id = mcpServerFixtureIds.enabled;
      const payload = {
        server: {
          id,
          name: 'Primary MCP Server',
          enabled: true,
          transport: McpServerTransport.http,
          url: 'https://mcp.example.com/main',
        },
        toolCount: 1,
        tools: [
          {
            name: 'calculator',
            title: 'Calculator',
            description: 'Performs arithmetic operations',
            inputSchema: {
              type: 'object',
            },
          },
        ],
        meta: { source: 'mcp' },
      };
      jest
        .spyOn(mcpClientPoolService, 'listToolsForDiagnostics')
        .mockResolvedValue(payload as any);

      const result = await controller.tools(id);

      expect(mcpClientPoolService.listToolsForDiagnostics).toHaveBeenCalledWith(
        id,
      );
      expect(result).toEqualPayload(payload);
    });
  });
});
