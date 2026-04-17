/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';

import { SubscriberService } from '@/chat/services/subscriber.service';
import { CONSOLE_CHANNEL_NAME } from '@/extensions/channels/console/console-channel.settings';
import { WEB_CHANNEL_NAME } from '@/extensions/channels/web/web-channel.settings';
import { LoggerService } from '@/logger/logger.service';
import { SocketRequest } from '@/websocket/utils/socket-request';
import { SocketResponse } from '@/websocket/utils/socket-response';
import { WorkflowService } from '@/workflow/services/workflow.service';

import { ChannelService } from './channel.service';

describe('ChannelService', () => {
  let service: ChannelService;
  let webChannelHandler: {
    handle: jest.Mock;
  };
  let consoleChannelHandler: { handle: jest.Mock };
  let workflowService: jest.Mocked<Pick<WorkflowService, 'findOne'>>;

  beforeEach(() => {
    const logger = {
      log: jest.fn(),
    } as jest.Mocked<Pick<LoggerService, 'log'>>;
    const subscriberService = {
      updateOne: jest.fn(),
    } as unknown as SubscriberService;

    workflowService = {
      findOne: jest.fn(),
    };

    service = new ChannelService(
      logger as unknown as LoggerService,
      subscriberService,
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
    const req = {
      method: 'GET',
      query: {},
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;

    await service.handleWebsocketForWebChannel(req, res);

    expect(workflowService.findOne).not.toHaveBeenCalled();
    expect(webChannelHandler.handle).toHaveBeenCalledWith(req, res, undefined);
  });

  it('validates and forwards workflow id for websocket web requests', async () => {
    const workflowId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const req = {
      method: 'POST',
      query: { workflow_id: workflowId },
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;
    workflowService.findOne.mockResolvedValue({ id: workflowId } as any);

    await service.handleWebsocketForWebChannel(req, res);

    expect(workflowService.findOne).toHaveBeenCalledWith(workflowId);
    expect(webChannelHandler.handle).toHaveBeenCalledWith(req, res, workflowId);
  });

  it('throws 404 for websocket web requests with unknown workflow id', async () => {
    const workflowId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const req = {
      method: 'POST',
      query: { workflow_id: workflowId },
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;
    workflowService.findOne.mockResolvedValue(null);

    await expect(
      service.handleWebsocketForWebChannel(req, res),
    ).rejects.toThrow(
      new NotFoundException(`Workflow with ID ${workflowId} not found`),
    );
    expect(webChannelHandler.handle).not.toHaveBeenCalled();
  });

  it('validates and forwards workflow id for websocket console requests', async () => {
    const workflowId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const req = {
      method: 'POST',
      query: { workflow_id: workflowId },
      session: {
        passport: {
          user: { id: 'user-1' },
        },
        web: {
          profile: {
            id: 'subscriber-1',
          },
        },
      },
    } as unknown as SocketRequest;
    const res = {} as SocketResponse;
    workflowService.findOne.mockResolvedValue({ id: workflowId } as any);

    await service.handleWebsocketForAdminChatConsole(req, res);

    expect(workflowService.findOne).toHaveBeenCalledWith(workflowId);
    expect(consoleChannelHandler.handle).toHaveBeenCalledWith(
      req,
      res,
      workflowId,
    );
  });
});
