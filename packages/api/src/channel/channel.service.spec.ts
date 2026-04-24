/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Source } from '@hexabot-ai/types';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';

import { SubscriberService } from '@/chat/services/subscriber.service';
import { CONSOLE_CHANNEL_NAME } from '@/extensions/channels/console/console-channel.settings';
import { WEB_CHANNEL_NAME } from '@/extensions/channels/web/web-channel.settings';
import { LoggerService } from '@/logger/logger.service';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WorkflowService } from '@/workflow/services/workflow.service';

import { ChannelService } from './channel.service';
import { SourceService } from './services/source.service';

const makeSource = (overrides: Partial<Source> = {}): Source => {
  return {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'main-web',
    channel: WEB_CHANNEL_NAME,
    settings: {},
    state: true,
    defaultWorkflow: null,
    ...overrides,
  };
};

describe('ChannelService', () => {
  let service: ChannelService;
  let webChannelHandler: {
    handle: jest.Mock;
  };
  let consoleChannelHandler: {
    handle: jest.Mock;
  };
  let workflowService: jest.Mocked<Pick<WorkflowService, 'findOne'>>;
  let sourceService: jest.Mocked<
    Pick<SourceService, 'findActiveById' | 'ensureDefaultSources'>
  >;
  let subscriberService: jest.Mocked<Pick<SubscriberService, 'updateOne'>>;

  beforeEach(() => {
    const logger = {
      log: jest.fn(),
    } as jest.Mocked<Pick<LoggerService, 'log'>>;
    subscriberService = {
      updateOne: jest.fn(),
    };
    sourceService = {
      findActiveById: jest.fn(),
      ensureDefaultSources: jest.fn(),
    };
    workflowService = {
      findOne: jest.fn(),
    };

    service = new ChannelService(
      logger as unknown as LoggerService,
      subscriberService as unknown as SubscriberService,
      sourceService as unknown as SourceService,
      workflowService as unknown as WorkflowService,
    );

    webChannelHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    consoleChannelHandler = {
      handle: jest.fn().mockResolvedValue(undefined),
    };

    service.setChannel(WEB_CHANNEL_NAME, webChannelHandler as any);
    service.setChannel(CONSOLE_CHANNEL_NAME, consoleChannelHandler as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('forwards websocket web requests without workflow id', async () => {
    const source = makeSource();
    sourceService.findActiveById.mockResolvedValue(source);

    const req = {
      method: 'GET',
      query: {},
      params: { sourceId: source.id },
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;

    await service.handleWebsocketForSource(req, res);

    expect(workflowService.findOne).not.toHaveBeenCalled();
    expect(webChannelHandler.handle).toHaveBeenCalledWith(
      req,
      res,
      source,
      undefined,
    );
  });

  it('validates and forwards explicit workflow id for websocket requests', async () => {
    const workflowId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const source = makeSource();
    sourceService.findActiveById.mockResolvedValue(source);
    workflowService.findOne.mockResolvedValue({ id: workflowId } as any);

    const req = {
      method: 'POST',
      query: { workflow_id: workflowId },
      params: { sourceId: source.id },
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;

    await service.handleWebsocketForSource(req, res);

    expect(workflowService.findOne).toHaveBeenCalledWith(workflowId);
    expect(webChannelHandler.handle).toHaveBeenCalledWith(
      req,
      res,
      source,
      workflowId,
    );
  });

  it('falls back to source default workflow when no explicit workflow is provided', async () => {
    const defaultWorkflowId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const source = makeSource({
      defaultWorkflow: defaultWorkflowId,
    });
    sourceService.findActiveById.mockResolvedValue(source);

    const req = {
      method: 'POST',
      query: {},
      params: { sourceId: source.id },
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;

    await service.handleWebsocketForSource(req, res);

    expect(workflowService.findOne).not.toHaveBeenCalled();
    expect(webChannelHandler.handle).toHaveBeenCalledWith(
      req,
      res,
      source,
      defaultWorkflowId,
    );
  });

  it('throws 404 for websocket requests with unknown explicit workflow id', async () => {
    const workflowId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const source = makeSource();
    sourceService.findActiveById.mockResolvedValue(source);
    workflowService.findOne.mockResolvedValue(null);

    const req = {
      method: 'POST',
      query: { workflow_id: workflowId },
      params: { sourceId: source.id },
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;

    await expect(service.handleWebsocketForSource(req, res)).rejects.toThrow(
      new NotFoundException(`Workflow with ID ${workflowId} not found`),
    );
    expect(webChannelHandler.handle).not.toHaveBeenCalled();
  });

  it('rejects console websocket usage for unauthenticated sessions', async () => {
    const source = makeSource({
      channel: CONSOLE_CHANNEL_NAME,
    });
    sourceService.findActiveById.mockResolvedValue(source);

    const req = {
      method: 'POST',
      query: {},
      params: { sourceId: source.id },
      session: {},
      socket: { client: { conn: { close: jest.fn() } } },
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;

    await expect(service.handleWebsocketForSource(req, res)).rejects.toThrow(
      new UnauthorizedException(
        'Only authenticated users are allowed to use this channel',
      ),
    );
    expect(consoleChannelHandler.handle).not.toHaveBeenCalled();
  });
});
