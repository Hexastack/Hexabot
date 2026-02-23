/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import axios from 'axios';

import { ActionService } from '@/actions/actions.service';
import { WorkflowRuntimeContext } from '@/workflow/contexts/workflow-runtime.context';

import { HttpRequestAction } from './http-request.action';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    request: jest.fn(),
  },
}));

describe('HttpRequestAction', () => {
  let actionService: ActionService;
  let action: InstanceType<typeof HttpRequestAction>;
  let logger: { warn: jest.Mock };
  let context: WorkflowRuntimeContext;

  const getRequestMock = () => axios.request as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    actionService = { register: jest.fn() } as unknown as ActionService;
    action = new HttpRequestAction(actionService);
    logger = { warn: jest.fn() };
    context = { services: { logger } } as unknown as WorkflowRuntimeContext;
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it('sends a GET request with normalized headers and parses JSON string responses', async () => {
    const requestMock = getRequestMock();
    const input = {
      url: 'https://example.com/resource',
      headers: {
        Authorization: 'Bearer token',
      },
    };

    requestMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      data: '{"hello":"world"}',
      request: { res: { responseUrl: 'https://final.example.com/resource' } },
    });

    const result = await action.execute({
      input,
      context,
      settings: {} as any,
    });

    expect(requestMock).toHaveBeenCalledTimes(1);
    const requestArgs = requestMock.mock.calls[0][0];

    expect(requestArgs).toEqual(
      expect.objectContaining({
        url: input.url,
        method: 'GET',
        timeout: 10000,
        validateStatus: expect.any(Function),
        headers: {
          'user-agent':
            'HexabotBot/1.0 (+https://hexabot.ai; email=hello@hexabot.ai)',
          accept: 'application/json',
          'content-type': 'application/json',
          authorization: 'Bearer token',
        },
      }),
    );
    expect(requestArgs).not.toHaveProperty('data');

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      status_text: 'OK',
      url: input.url,
      final_url: 'https://final.example.com/resource',
      body: { hello: 'world' },
      content_type: 'application/json; charset=utf-8',
      truncated: false,
    });
  });

  it('parses JSON string request body for POST and returns object responses', async () => {
    const requestMock = getRequestMock();
    const input = {
      url: 'https://example.com/submit',
      body: '{"ping":"pong"}',
    };

    requestMock.mockResolvedValueOnce({
      status: 201,
      statusText: 'Created',
      headers: {},
      data: { id: 42 },
    });

    const result = await action.execute({
      input,
      context,
      settings: { method: 'POST', timeout_ms: 5000 } as any,
    });

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: input.url,
        method: 'POST',
        timeout: 5000,
        data: { ping: 'pong' },
      }),
    );

    expect(result).toMatchObject({
      ok: true,
      status: 201,
      status_text: 'Created',
      url: input.url,
      final_url: input.url,
      body: { id: 42 },
      truncated: false,
    });
    expect(result.content_type).toBeUndefined();
  });

  it('keeps raw string when POST request body is not valid JSON', async () => {
    const requestMock = getRequestMock();
    const input = {
      url: 'https://example.com/plain',
      body: 'ping=pong',
    };

    requestMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: {},
      data: { ok: true },
    });

    await action.execute({
      input,
      context,
      settings: { method: 'POST' } as any,
    });

    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        url: input.url,
        method: 'POST',
        data: 'ping=pong',
      }),
    );
  });

  it('converts binary response data to utf8 strings', async () => {
    const requestMock = getRequestMock();
    const input = { url: 'https://example.com/binary' };

    requestMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/plain' },
      data: Buffer.from('binary-body'),
    });

    const result = await action.execute({
      input,
      context,
      settings: {} as any,
    });

    expect(result).toMatchObject({
      ok: true,
      status: 200,
      status_text: 'OK',
      url: input.url,
      final_url: input.url,
      body: 'binary-body',
      content_type: 'text/plain',
      truncated: false,
    });
  });

  it('logs a warning and returns raw text when JSON parsing fails', async () => {
    const requestMock = getRequestMock();
    const input = { url: 'https://example.com/bad-json' };

    requestMock.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: '{invalid}',
    });

    const result = await action.execute({
      input,
      context,
      settings: {} as any,
    });

    expect(logger.warn).toHaveBeenCalledWith(
      `http_request JSON parse failed for ${input.url}`,
      { error: expect.any(String) },
    );
    expect(result.body).toBe('{invalid}');
  });

  it('handles network errors and returns a failure payload', async () => {
    const requestMock = getRequestMock();
    const input = { url: 'https://example.com/down' };

    requestMock.mockRejectedValueOnce(new Error('network down'));

    const result = await action.execute({
      input,
      context,
      settings: {} as any,
    });

    expect(logger.warn).toHaveBeenCalledWith(
      `http_request failed for ${input.url}`,
      { error: 'network down' },
    );
    expect(result).toMatchObject({
      ok: false,
      status: 0,
      status_text: 'network_error',
      url: input.url,
      body: '',
      truncated: false,
      error: 'network down',
    });
  });
});
