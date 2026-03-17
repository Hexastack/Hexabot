/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { EntityType, Format } from "@/services/types";

import { IBaseSchema, IFormat, OmitPopulate } from "./base.types";
import { ICredential } from "./credential.types";

export enum McpServerTransport {
  http = "http",
  stdio = "stdio",
}

export interface IMcpServerAttributes {
  name: string;
  enabled: boolean;
  transport: McpServerTransport;
  url: string | null;
  command: string | null;
  args: string[] | null;
  cwd: string | null;
  credential: string | null;
}

export interface IMcpServerStub
  extends IBaseSchema,
    OmitPopulate<IMcpServerAttributes, EntityType.MCP_SERVER> {}

export interface IMcpServer extends IMcpServerStub, IFormat<Format.BASIC> {
  credential: string | null;
}

export interface IMcpServerFull extends IMcpServerStub, IFormat<Format.FULL> {
  credential?: ICredential | null;
}

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

export interface IMcpServerTool
  extends IMcpServerToolAttributes,
    IFormat<Format.BASIC> {
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
