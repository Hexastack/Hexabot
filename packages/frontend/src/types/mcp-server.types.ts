/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  McpServerTransport,
  type McpServer as SharedMcpServer,
} from "@hexabot-ai/types";

export { McpServerTransport };

export type McpServer = SharedMcpServer;

export interface IMcpServerToolAttributes {
  serverId: string;
  name: string;
  title?: string;
  description?: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}

export interface IMcpServerTool extends IMcpServerToolAttributes {
  id: string;
}

export type IMcpToolSummary = IMcpServerTool;

export type IMcpServerInfo = {
  id: string;
  name: string;
  enabled: boolean;
  transport: McpServerTransport;
  url: string | null;
  command?: string;
  args?: string[];
  cwd?: string;
};

export type IMcpServerToolsDiscovery = {
  server: IMcpServerInfo;
  toolCount: number;
  tools: IMcpToolSummary[];
  meta?: Record<string, unknown>;
};

export type IMcpServerDiagnostics = {
  ok: boolean;
  checkedAt: string;
  latencyMs: number;
  server: IMcpServerInfo;
  toolCount: number;
  sampledToolNames: string[];
  meta?: Record<string, unknown>;
  error?: string;
};
