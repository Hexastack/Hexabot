/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';
import { Request, Response } from 'express';

import { LoggerService } from '@/logger/logger.service';
import { WorkflowService } from '@/workflow/services/workflow.service';

import { ChannelService } from './channel.service';
import { WebhookController } from './webhook.controller';

describe('WebhookController', () => {
  let controller: WebhookController;
  let channelService: jest.Mocked<Pick<ChannelService, 'handle' | 'download'>>;
  let workflowService: jest.Mocked<Pick<WorkflowService, 'findOne'>>;
  let logger: jest.Mocked<Pick<LoggerService, 'log'>>;

  beforeEach(() => {
    channelService = {
      handle: jest.fn().mockResolvedValue(undefined),
      download: jest.fn(),
    };
    workflowService = {
      findOne: jest.fn(),
    };
    logger = {
      log: jest.fn(),
    };

    controller = new WebhookController(
      channelService as unknown as ChannelService,
      workflowService as unknown as WorkflowService,
      logger as unknown as LoggerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates untargeted channel requests without workflow id', async () => {
    const req = { method: 'POST' } as unknown as Request;
    const res = {} as Response;

    await controller.handlePost('web', req, res);

    expect(workflowService.findOne).not.toHaveBeenCalled();
    expect(channelService.handle).toHaveBeenCalledWith(
      'web',
      req,
      res,
      undefined,
    );
  });

  it('delegates targeted channel requests with workflow id when workflow exists', async () => {
    const workflowId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const req = { method: 'POST' } as unknown as Request;
    const res = {} as Response;
    workflowService.findOne.mockResolvedValue({ id: workflowId } as any);

    await controller.handlePostWithWorkflow('web', workflowId, req, res);

    expect(workflowService.findOne).toHaveBeenCalledWith(workflowId);
    expect(channelService.handle).toHaveBeenCalledWith(
      'web',
      req,
      res,
      workflowId,
    );
  });

  it('throws 404 when targeted workflow does not exist', async () => {
    const workflowId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const req = { method: 'POST' } as unknown as Request;
    const res = {} as Response;
    workflowService.findOne.mockResolvedValue(null);

    await expect(
      controller.handlePostWithWorkflow('web', workflowId, req, res),
    ).rejects.toThrow(
      new NotFoundException(`Workflow with ID ${workflowId} not found`),
    );
    expect(channelService.handle).not.toHaveBeenCalled();
  });
});
