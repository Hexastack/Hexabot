/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { isDeepStrictEqual } from 'node:util';

import {
  type WorkflowExportBundle,
  type WorkflowExportBundleMcpServer,
  type WorkflowImportResourceResult,
} from '@hexabot-ai/types';
import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager, In } from 'typeorm';

import { CredentialOrmEntity } from '@/user/entities/credential.entity';
import { McpServerOrmEntity } from '@/workflow/entities/mcp-server.entity';
import { McpServerService } from '@/workflow/services/mcp-server.service';
import { McpServerTransport } from '@/workflow/types';

import {
  assertFoundAll,
  buildPostCreateEvent,
  buildResourceResult,
  uniqueResourceIds,
  type WorkflowTransferImportAdapterResult,
} from '../workflow-transfer.types';

type McpServerExportResources = {
  credentialIds: string[];
  mcpServers: WorkflowExportBundleMcpServer[];
};

@Injectable()
export class McpServerTransferAdapter {
  constructor(private readonly mcpServerService: McpServerService) {}

  async buildExportResources(ids: string[]): Promise<McpServerExportResources> {
    const uniqueIds = uniqueResourceIds(ids);
    if (uniqueIds.length === 0) {
      return { credentialIds: [], mcpServers: [] };
    }

    const servers = await this.mcpServerService.findAndPopulate({
      where: { id: In(uniqueIds) },
    });
    assertFoundAll(
      'MCP server',
      uniqueIds,
      servers.map((server) => server.id),
    );

    return {
      credentialIds: servers
        .map((server) => server.credential?.id)
        .filter((id): id is string => typeof id === 'string' && !!id),
      mcpServers: servers.map((server) => ({
        exportId: server.id,
        name: server.name,
        enabled: server.enabled,
        transport: server.transport,
        url: server.url ?? null,
        command: server.command ?? null,
        args: server.args ?? null,
        cwd: server.cwd ?? null,
        credentialExportId: server.credential?.id ?? null,
      })),
    };
  }

  async importResources(
    manager: EntityManager,
    servers: WorkflowExportBundle['resources']['mcpServers'],
    credentialIdMap: Record<string, string>,
    placeholderCredentialExportIds: Set<string>,
  ): Promise<WorkflowTransferImportAdapterResult> {
    const idMap: Record<string, string> = {};
    const resources: WorkflowImportResourceResult[] = [];
    const warnings: string[] = [];
    const postCreateEvents: WorkflowTransferImportAdapterResult['postCreateEvents'] =
      [];

    for (const server of servers) {
      const credentialId = server.credentialExportId
        ? credentialIdMap[server.credentialExportId]
        : null;
      const credential = credentialId
        ? await manager.findOne(CredentialOrmEntity, {
            where: { id: credentialId },
          })
        : null;
      const importedCredential = server.credentialExportId
        ? credentialId
          ? credential
          : null
        : null;
      const shouldDisable =
        Boolean(server.credentialExportId) &&
        placeholderCredentialExportIds.has(server.credentialExportId!);
      const existing = await manager.findOne(McpServerOrmEntity, {
        where: { name: server.name },
        relations: ['credential'],
      });

      if (existing) {
        if (!this.isEquivalentMcpServer(existing, server, importedCredential)) {
          throw new ConflictException(
            `MCP server "${server.name}" already exists with different configuration`,
          );
        }

        idMap[server.exportId] = existing.id;
        resources.push(
          buildResourceResult({
            kind: 'mcpServer',
            exportId: server.exportId,
            localId: existing.id,
            name: server.name,
            action: 'reused',
          }),
        );
        continue;
      }

      if (server.credentialExportId && !credentialId) {
        throw new BadRequestException(
          `Workflow bundle is missing credential "${server.credentialExportId}" required by MCP server "${server.name}"`,
        );
      }

      const payload = {
        name: server.name,
        enabled: shouldDisable ? false : server.enabled,
        transport: server.transport,
        url: server.url,
        command: server.command,
        args: server.args,
        cwd: server.cwd,
        credential:
          credentialId && server.transport === McpServerTransport.http
            ? { id: credentialId }
            : null,
      };
      const created = await manager.save(
        McpServerOrmEntity,
        manager.create(McpServerOrmEntity, payload),
      );

      idMap[server.exportId] = created.id;
      resources.push(
        buildResourceResult({
          kind: 'mcpServer',
          exportId: server.exportId,
          localId: created.id,
          name: server.name,
          action: 'created',
        }),
      );
      postCreateEvents.push(
        buildPostCreateEvent('mcpServer', created, payload),
      );

      if (shouldDisable) {
        warnings.push(
          `MCP server "${server.name}" was disabled because it depends on an imported placeholder credential.`,
        );
      }
    }

    return {
      idMap,
      resources,
      warnings,
      postCreateEvents,
    };
  }

  private isEquivalentMcpServer(
    existing: McpServerOrmEntity,
    imported: WorkflowExportBundleMcpServer,
    importedCredential: CredentialOrmEntity | null,
  ): boolean {
    const existingCredentialName =
      existing.credential && typeof existing.credential === 'object'
        ? existing.credential.name
        : null;
    const importedCredentialName = importedCredential?.name ?? null;

    return (
      existing.transport === imported.transport &&
      (existing.url ?? null) === (imported.url ?? null) &&
      (existing.command ?? null) === (imported.command ?? null) &&
      isDeepStrictEqual(existing.args ?? null, imported.args ?? null) &&
      (existing.cwd ?? null) === (imported.cwd ?? null) &&
      existingCredentialName === importedCredentialName
    );
  }
}
