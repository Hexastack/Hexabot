/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

declare module '@ai-sdk/mcp/mcp-stdio' {
  export type StdioConfig = {
    command: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    stderr?: unknown;
  };

  export class Experimental_StdioMCPTransport {
    constructor(server: StdioConfig);

    start(): Promise<void>;

    send(message: unknown): Promise<void>;

    close(): Promise<void>;

    onclose?: () => void;

    onerror?: (error: unknown) => void;

    onmessage?: (message: unknown) => void;
  }
}
