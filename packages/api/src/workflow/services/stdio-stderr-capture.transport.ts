/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';

export class StdioStderrCaptureTransport extends Experimental_StdioMCPTransport {
  private static readonly MAX_STDERR_CHARS = 16_000;

  private stderrBuffer = '';

  private listenersAttached = false;

  private lastEmittedMessage: string | null = null;

  constructor(
    config: ConstructorParameters<typeof Experimental_StdioMCPTransport>[0],
    private readonly onStderrMessage?: (message: string) => void,
  ) {
    super(config);
  }

  async start(): Promise<void> {
    await super.start();
    this.attachListeners();
  }

  private attachListeners(): void {
    if (this.listenersAttached) {
      return;
    }

    const processRef = (
      this as unknown as {
        process?: {
          stderr?: NodeJS.ReadableStream | null;
          on?: (event: string, listener: (...args: any[]) => void) => void;
        };
      }
    ).process;
    if (!processRef) {
      return;
    }

    this.listenersAttached = true;
    processRef.on?.('close', () => {
      this.emitCapturedStderr();
    });

    const stderr = processRef.stderr;
    if (!stderr || typeof stderr.on !== 'function') {
      return;
    }

    (
      stderr as unknown as {
        setEncoding?: (encoding: BufferEncoding) => void;
      }
    ).setEncoding?.('utf8');

    stderr.on('data', (chunk: unknown) => {
      const value =
        typeof chunk === 'string'
          ? chunk
          : Buffer.isBuffer(chunk)
            ? chunk.toString('utf8')
            : String(chunk);

      this.appendStderrChunk(value);
      this.emitCapturedStderr();
    });
  }

  private appendStderrChunk(chunk: string): void {
    this.stderrBuffer = `${this.stderrBuffer}${chunk}`;
    if (
      this.stderrBuffer.length > StdioStderrCaptureTransport.MAX_STDERR_CHARS
    ) {
      this.stderrBuffer = this.stderrBuffer.slice(
        -StdioStderrCaptureTransport.MAX_STDERR_CHARS,
      );
    }
  }

  private emitCapturedStderr(): void {
    const message = this.stderrBuffer.trim();
    if (!message || message === this.lastEmittedMessage) {
      return;
    }

    this.lastEmittedMessage = message;
    this.onStderrMessage?.(message);
  }
}
