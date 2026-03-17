/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  createMCPClient,
  type ListToolsResult,
  type MCPClient,
} from '@ai-sdk/mcp';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { ToolSet } from 'ai';

import { LoggerService } from '@/logger/logger.service';
import { CredentialService } from '@/user';

import { McpServer } from '../dto/mcp-server.dto';
import { McpServerRepository } from '../repositories/mcp-server.repository';
import { McpServerTransport, McpToolBindingDefinitions } from '../types';

type PooledClientEntry = {
  client: MCPClient;
  signature: string;
  idleTimeout: NodeJS.Timeout | null;
};

type GetClientOptions = {
  allowDisabled: boolean;
};

export type McpToolSummary = {
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  meta?: Record<string, unknown>;
};

export type McpToolsDiscovery = {
  server: {
    id: string;
    name: string;
    enabled: boolean;
    transport: McpServerTransport;
    url: string;
  };
  toolCount: number;
  tools: McpToolSummary[];
  meta?: Record<string, unknown>;
};

export type McpServerDiagnostics = {
  ok: boolean;
  checkedAt: string;
  latencyMs: number;
  server: {
    id: string;
    name: string;
    enabled: boolean;
    transport: McpServerTransport;
    url: string;
  };
  toolCount: number;
  sampledToolNames: string[];
  meta?: Record<string, unknown>;
  error?: string;
};

@Injectable()
export class McpClientPoolService implements OnModuleDestroy {
  static readonly DEFAULT_IDLE_TTL_MS = 5 * 60 * 1000;

  private readonly sampledToolNamesCount = 10;

  private readonly clientPool = new Map<string, PooledClientEntry>();

  private readonly initFlights = new Map<string, Promise<MCPClient>>();

  /**
   * Creates the MCP client pool service.
   *
   * @param mcpServerRepository - MCP server repository instance.
   * @param credentialService - Credential service used to resolve secrets.
   * @param logger - Logger service instance.
   * @returns New service instance.
   */
  constructor(
    private readonly mcpServerRepository: McpServerRepository,
    private readonly credentialService: CredentialService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Closes all pooled MCP clients when the module is shutting down.
   *
   * @returns No return value.
   */
  async onModuleDestroy(): Promise<void> {
    const entries = Array.from(this.clientPool.entries());
    this.clientPool.clear();
    this.initFlights.clear();

    await Promise.allSettled(
      entries.map(async ([serverId, entry]) => {
        this.clearIdleTimeout(entry);
        try {
          await entry.client.close();
        } catch (error) {
          this.logger.warn(
            `Unable to close MCP client during shutdown for server "${serverId}"`,
            error,
          );
        }
      }),
    );
  }

  /**
   * Returns a pooled MCP client for runtime usage.
   *
   * @param serverId - MCP server identifier.
   * @returns Connected MCP client.
   */
  async getOrCreateClient(serverId: string): Promise<MCPClient> {
    return await this.getOrCreateClientInternal(serverId, {
      allowDisabled: false,
    });
  }

  /**
   * Lists MCP tools for runtime usage.
   *
   * @param serverId - MCP server identifier.
   * @returns Raw MCP listTools result.
   */
  async listTools(serverId: string): Promise<ListToolsResult> {
    const client = await this.getOrCreateClient(serverId);

    return await client.listTools();
  }

  /**
   * Lists MCP tools for diagnostics usage.
   *
   * @param serverId - MCP server identifier.
   * @returns Normalized tool discovery payload.
   */
  async listToolsForDiagnostics(serverId: string): Promise<McpToolsDiscovery> {
    const server = await this.findServerOrFail(serverId);
    const client = await this.getOrCreateClientInternal(serverId, {
      allowDisabled: true,
    });
    const definitions = await client.listTools();
    const tools = this.normalizeTools(definitions);

    return {
      server: {
        id: server.id,
        name: server.name,
        enabled: server.enabled,
        transport: server.transport,
        url: server.url,
      },
      toolCount: tools.length,
      tools,
      ...(this.toObject(definitions._meta)
        ? { meta: this.toObject(definitions._meta) }
        : {}),
    };
  }

  /**
   * Runs connectivity diagnostics for an MCP server.
   *
   * @param serverId - MCP server identifier.
   * @returns Diagnostics status payload.
   */
  async testServer(serverId: string): Promise<McpServerDiagnostics> {
    const server = await this.findServerOrFail(serverId);
    const startedAt = Date.now();

    try {
      const discovery = await this.listToolsForDiagnostics(serverId);
      const latencyMs = Date.now() - startedAt;

      return {
        ok: true,
        checkedAt: new Date().toISOString(),
        latencyMs,
        server: discovery.server,
        toolCount: discovery.toolCount,
        sampledToolNames: discovery.tools
          .slice(0, this.sampledToolNamesCount)
          .map((tool) => tool.name),
        ...(discovery.meta ? { meta: discovery.meta } : {}),
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      const message =
        error instanceof Error ? error.message : 'Unknown connection error';

      return {
        ok: false,
        checkedAt: new Date().toISOString(),
        latencyMs,
        server: {
          id: server.id,
          name: server.name,
          enabled: server.enabled,
          transport: server.transport,
          url: server.url,
        },
        toolCount: 0,
        sampledToolNames: [],
        error: message,
      };
    }
  }

  /**
   * Builds a namespaced AI SDK ToolSet from MCP tool bindings.
   *
   * @param bindingDefs - MCP binding definitions keyed by binding name.
   * @returns Aggregated namespaced ToolSet.
   */
  async buildToolSet(bindingDefs: McpToolBindingDefinitions): Promise<ToolSet> {
    const toolSet: ToolSet = {};

    for (const [bindingName, definition] of Object.entries(bindingDefs ?? {})) {
      const normalizedBindingName = bindingName.trim();
      if (!normalizedBindingName) {
        throw new BadRequestException('Tool binding name cannot be empty');
      }

      const serverId = definition?.settings?.server_id?.trim();
      if (!serverId) {
        throw new BadRequestException(
          `bindings.tools.${normalizedBindingName}.settings.server_id is required`,
        );
      }

      const selectedToolNames = new Set(
        (definition?.settings?.tool_names ?? [])
          .filter((name): name is string => typeof name === 'string')
          .map((name) => name.trim())
          .filter(Boolean),
      );
      const client = await this.getOrCreateClient(serverId);
      const definitions = await client.listTools();
      const filteredTools =
        selectedToolNames.size > 0
          ? definitions.tools.filter((tool) => selectedToolNames.has(tool.name))
          : definitions.tools;

      if (!filteredTools.length) {
        continue;
      }

      const scopedDefinitions: ListToolsResult = {
        ...definitions,
        tools: filteredTools,
      };
      const bindingTools = client.toolsFromDefinitions(
        scopedDefinitions,
      ) as ToolSet;

      for (const [toolName, tool] of Object.entries(bindingTools)) {
        const prefixedToolName = `${normalizedBindingName}__${toolName}`;
        if (prefixedToolName in toolSet) {
          throw new BadRequestException(
            `Duplicate MCP tool name "${prefixedToolName}"`,
          );
        }

        toolSet[prefixedToolName] = tool as ToolSet[string];
      }
    }

    return toolSet;
  }

  /**
   * Returns a pooled client and initializes it when absent.
   *
   * @param serverId - MCP server identifier.
   * @param options - Internal options controlling disabled-server behavior.
   * @returns Connected MCP client.
   */
  private async getOrCreateClientInternal(
    serverId: string,
    options: GetClientOptions,
  ): Promise<MCPClient> {
    const server = await this.findServerOrFail(serverId);
    if (!options.allowDisabled && !server.enabled) {
      throw new BadRequestException(
        `MCP server "${server.name}" (${serverId}) is disabled`,
      );
    }

    const signature = this.computeServerSignature(server);
    const existingEntry = this.clientPool.get(serverId);
    if (existingEntry) {
      if (existingEntry.signature !== signature) {
        await this.evictClient(serverId);
      } else {
        this.touchClient(serverId, existingEntry);

        return existingEntry.client;
      }
    }

    const existingInit = this.initFlights.get(serverId);
    if (existingInit) {
      return await existingInit;
    }

    const initPromise = this.initializeClient(server, signature).finally(() => {
      this.initFlights.delete(serverId);
    });
    this.initFlights.set(serverId, initPromise);

    return await initPromise;
  }

  /**
   * Initializes and stores a new pooled client entry.
   *
   * @param server - MCP server configuration.
   * @param signature - Cache signature for entry invalidation.
   * @returns Connected MCP client.
   */
  private async initializeClient(
    server: McpServer,
    signature: string,
  ): Promise<MCPClient> {
    const client = await this.createClient(server);
    const entry: PooledClientEntry = {
      client,
      signature,
      idleTimeout: null,
    };
    this.clientPool.set(server.id, entry);
    this.touchClient(server.id, entry);

    return client;
  }

  /**
   * Creates an MCP client for the provided server.
   *
   * @param server - MCP server configuration.
   * @returns Connected MCP client.
   */
  private async createClient(server: McpServer): Promise<MCPClient> {
    if (server.transport !== McpServerTransport.http) {
      throw new BadRequestException(
        `Unsupported MCP transport "${server.transport}" for server "${server.name}"`,
      );
    }

    const headers = await this.buildHeaders(server);

    return await createMCPClient({
      transport: {
        type: 'http',
        url: server.url,
        ...(headers ? { headers } : {}),
      },
      onUncaughtError: (error) => {
        this.logger.error(
          `Unhandled error in MCP client for server "${server.id}"`,
          error,
        );
      },
    });
  }

  /**
   * Resolves one MCP server or throws when it does not exist.
   *
   * @param serverId - MCP server identifier.
   * @returns MCP server record.
   */
  private async findServerOrFail(serverId: string): Promise<McpServer> {
    const server = await this.mcpServerRepository.findOne(serverId);
    if (!server) {
      throw new NotFoundException(`MCP server with ID ${serverId} not found`);
    }

    return server;
  }

  /**
   * Builds HTTP headers for MCP requests.
   *
   * @param server - MCP server configuration.
   * @returns Headers map or undefined when no headers are required.
   */
  private async buildHeaders(
    server: McpServer,
  ): Promise<Record<string, string> | undefined> {
    const credentialId = server.credential ?? undefined;
    if (!credentialId) {
      return undefined;
    }

    const value = await this.credentialService.findOneValue(credentialId);
    if (!value) {
      throw new BadRequestException(
        `Credential "${credentialId}" configured for MCP server "${server.id}" has no value`,
      );
    }

    return {
      Authorization: `Bearer ${value}`,
    };
  }

  /**
   * Computes a cache signature for MCP server client reuse.
   *
   * @param server - MCP server configuration.
   * @returns Deterministic cache signature.
   */
  private computeServerSignature(server: McpServer): string {
    return [server.transport, server.url, server.credential ?? ''].join('|');
  }

  /**
   * Refreshes the idle timeout for a pooled client.
   *
   * @param serverId - MCP server identifier.
   * @param entry - Pooled client entry.
   * @returns No return value.
   */
  private touchClient(serverId: string, entry: PooledClientEntry): void {
    this.clearIdleTimeout(entry);
    entry.idleTimeout = setTimeout(() => {
      void this.evictClient(serverId);
    }, McpClientPoolService.DEFAULT_IDLE_TTL_MS);
    entry.idleTimeout.unref?.();
  }

  /**
   * Clears the idle timeout for a pooled client entry.
   *
   * @param entry - Pooled client entry.
   * @returns No return value.
   */
  private clearIdleTimeout(entry: PooledClientEntry): void {
    if (entry.idleTimeout) {
      clearTimeout(entry.idleTimeout);
      entry.idleTimeout = null;
    }
  }

  /**
   * Closes and removes a pooled client entry.
   *
   * @param serverId - MCP server identifier.
   * @returns No return value.
   */
  private async evictClient(serverId: string): Promise<void> {
    const entry = this.clientPool.get(serverId);
    if (!entry) {
      return;
    }

    this.clientPool.delete(serverId);
    this.clearIdleTimeout(entry);
    try {
      await entry.client.close();
    } catch (error) {
      this.logger.warn(
        `Unable to close MCP client for server "${serverId}"`,
        error,
      );
    }
  }

  /**
   * Converts raw MCP tool definitions into API summary objects.
   *
   * @param definitions - Raw MCP listTools payload.
   * @returns Normalized tool summaries.
   */
  private normalizeTools(definitions: ListToolsResult): McpToolSummary[] {
    return definitions.tools.map((tool) => {
      const meta = this.toObject(tool._meta);
      const annotations = this.toObject(tool.annotations);
      const outputSchema = this.toObject(tool.outputSchema);

      return {
        name: tool.name,
        ...(tool.title ? { title: tool.title } : {}),
        ...(tool.description ? { description: tool.description } : {}),
        inputSchema: tool.inputSchema as Record<string, unknown>,
        ...(outputSchema ? { outputSchema } : {}),
        ...(annotations ? { annotations } : {}),
        ...(meta ? { meta } : {}),
      };
    });
  }

  /**
   * Narrows unknown values to plain object records.
   *
   * @param value - Unknown value to normalize.
   * @returns Object value when valid, otherwise undefined.
   */
  private toObject(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }
}
