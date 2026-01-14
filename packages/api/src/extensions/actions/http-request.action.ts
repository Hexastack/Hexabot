/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { z } from 'zod';

import { createAction } from '@/actions/create-action';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

const httpRequestInputSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  timeout_ms: z.number().int().positive().max(60000).optional(),
  max_bytes: z.number().int().positive().max(5_000_000).optional(),
});
const httpRequestOutputSchema = z.object({
  ok: z.boolean(),
  status: z.number().int(),
  status_text: z.string(),
  url: z.string(),
  final_url: z.string().optional(),
  headers: z.record(z.string()),
  body: z.string(),
  content_type: z.string().optional(),
  truncated: z.boolean(),
  error: z.string().optional(),
});

type HttpRequestInput = z.infer<typeof httpRequestInputSchema>;
type HttpRequestOutput = z.infer<typeof httpRequestOutputSchema>;

const DEFAULT_USER_AGENT =
  'HexabotBot/1.0 (+https://hexabot.ai; email=opensource@hexastack.com)';

async function readBodyWithLimit(
  response: Response,
  maxBytes: number,
): Promise<{ content: string; truncated: boolean }> {
  if (!response.body) {
    const text = await response.text();

    return {
      content: text.length > maxBytes ? text.slice(0, maxBytes) : text,
      truncated: text.length > maxBytes,
    };
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  let truncated = false;

  // Read the stream in chunks until we reach the maxBytes limit.
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    if (value) {
      const nextSize = received + value.byteLength;
      if (nextSize > maxBytes) {
        const allowed = Math.max(0, maxBytes - received);
        if (allowed > 0) {
          chunks.push(value.slice(0, allowed));
        }
        truncated = true;
        await reader.cancel();
        break;
      }

      chunks.push(value);
      received = nextSize;
    }
  }

  const buffer = Buffer.concat(chunks);
  const decoder = new TextDecoder();

  return { content: decoder.decode(buffer), truncated };
}

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });

  return record;
}

export const HttpRequestAction = createAction<
  HttpRequestInput,
  HttpRequestOutput,
  WorkflowRuntimeContext
>({
  name: 'http_request',
  description:
    'Performs an HTTP GET request and returns status, headers, and body with a safe User-Agent.',
  inputSchema: httpRequestInputSchema,
  outputSchema: httpRequestOutputSchema,
  async execute({ input, context }) {
    const logger = context.services.logger;
    const timeoutMs = input.timeout_ms ?? 10000;
    const maxBytes = input.max_bytes ?? 2_000_000; // 2 MB safeguard
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(input.url, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'user-agent': DEFAULT_USER_AGENT,
          accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          ...input.headers,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      const { content, truncated } = await readBodyWithLimit(
        response,
        maxBytes,
      );

      return {
        ok: response.ok,
        status: response.status,
        status_text: response.statusText ?? '',
        url: input.url,
        final_url: response.url || input.url,
        headers: headersToRecord(response.headers),
        body: content,
        content_type: response.headers.get('content-type') ?? undefined,
        truncated,
      };
    } catch (error) {
      clearTimeout(timeout);
      const message =
        error instanceof Error ? error.message : 'Unknown network error';

      logger.warn(`http_request failed for ${input.url}`, { error: message });

      return {
        ok: false,
        status: 0,
        status_text: 'network_error',
        url: input.url,
        headers: {},
        body: '',
        truncated: false,
        error: message,
      };
    }
  },
});

export default HttpRequestAction;
