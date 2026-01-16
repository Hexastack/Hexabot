/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { JsonValueSchema, SettingsSchema } from '@hexabot-ai/agentic';
import axios from 'axios';
import { z } from 'zod';

import { createAction } from '@/actions/create-action';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

const httpRequestInputSchema = z.object({
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: JsonValueSchema.optional(),
});
const httpRequestSettingsSchema = SettingsSchema.extend({
  method: z.enum(['GET', 'POST']).default('GET'),
  timeout_ms: z.number().int().positive().max(60000).default(10000),
});
const httpRequestOutputSchema = z.object({
  ok: z.boolean(),
  status: z.number().int(),
  status_text: z.string(),
  url: z.string(),
  final_url: z.string().optional(),
  body: JsonValueSchema,
  content_type: z.string().optional(),
  truncated: z.boolean(),
  error: z.string().optional(),
});

type HttpRequestInput = z.infer<typeof httpRequestInputSchema>;
type HttpRequestOutput = z.infer<typeof httpRequestOutputSchema>;
type HttpRequestSettings = z.infer<typeof httpRequestSettingsSchema>;

const DEFAULT_USER_AGENT =
  'HexabotBot/1.0 (+https://hexabot.ai; email=hello@hexabot.ai)';

function normalizeHeaders(
  headers?: Record<string, string>,
): Record<string, string> {
  if (!headers) {
    return {};
  }

  return Object.entries(headers).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[key.toLowerCase()] = value;

      return acc;
    },
    {},
  );
}

function isJsonContentType(contentType?: string) {
  if (!contentType) {
    return false;
  }

  const normalized = contentType.toLowerCase();

  return (
    normalized.includes('application/json') ||
    normalized.includes('text/json') ||
    normalized.includes('+json')
  );
}

function resolveFinalUrl(response: {
  request?: { res?: { responseUrl?: string }; responseUrl?: string };
}) {
  return response.request?.res?.responseUrl ?? response.request?.responseUrl;
}

export const HttpRequestAction = createAction<
  HttpRequestInput,
  HttpRequestOutput,
  WorkflowRuntimeContext,
  HttpRequestSettings
>({
  name: 'http_request',
  description:
    'Performs an HTTP request (GET/POST) and returns status, headers, and body with a safe User-Agent.',
  inputSchema: httpRequestInputSchema,
  outputSchema: httpRequestOutputSchema,
  settingsSchema: httpRequestSettingsSchema,
  async execute({ input, context, settings }) {
    const logger = context.services.logger;
    const timeoutMs = settings.timeout_ms ?? 10000;
    const method = settings.method ?? 'GET';
    const headers = {
      'user-agent': DEFAULT_USER_AGENT,
      accept: 'application/json',
      'content-type': 'application/json',
      ...normalizeHeaders(input.headers),
    };

    try {
      const response = await axios.request({
        url: input.url,
        method,
        headers,
        timeout: timeoutMs,
        validateStatus: () => true,
        ...(method === 'POST' && input.body !== undefined
          ? { data: input.body }
          : {}),
      });
      const contentTypeHeader = response.headers?.['content-type'];
      const contentType = Array.isArray(contentTypeHeader)
        ? contentTypeHeader.join(', ')
        : contentTypeHeader;
      const responseData = response.data;
      let body: HttpRequestOutput['body'] = '';

      if (responseData === undefined || responseData === null) {
        body = '';
      } else if (typeof responseData === 'string') {
        const trimmed = responseData.trim();
        if (isJsonContentType(contentType) && trimmed) {
          try {
            body = JSON.parse(trimmed) as HttpRequestOutput['body'];
          } catch (error) {
            const message =
              error instanceof Error ? error.message : 'Invalid JSON response';
            logger.warn(`http_request JSON parse failed for ${input.url}`, {
              error: message,
            });
            body = responseData;
          }
        } else {
          body = responseData;
        }
      } else if (Buffer.isBuffer(responseData)) {
        body = responseData.toString('utf8');
      } else if (responseData instanceof ArrayBuffer) {
        body = Buffer.from(responseData).toString('utf8');
      } else if (responseData instanceof Uint8Array) {
        body = Buffer.from(responseData).toString('utf8');
      } else {
        body = responseData as HttpRequestOutput['body'];
      }

      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        status_text: response.statusText ?? '',
        url: input.url,
        final_url: resolveFinalUrl(response) ?? input.url,
        body,
        content_type: contentType ?? undefined,
        truncated: false,
      };
    } catch (error) {
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
