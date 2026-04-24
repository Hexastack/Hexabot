/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { INestApplication } from '@nestjs/common';
import { Request, Response } from 'express';
import request from 'supertest';

import { LoggerService } from '@/logger/logger.service';
import { buildTestingMocks } from '@/utils/test/utils';

import { ChannelService } from './channel.service';
import { ChannelDownloadService } from './services/channel-download.service';
import { WebhookController } from './webhook.controller';

describe('WebhookController', () => {
  let controller: WebhookController;
  let channelService: jest.Mocked<Pick<ChannelService, 'handle'>>;
  let channelDownloadService: jest.Mocked<
    Pick<ChannelDownloadService, 'download'>
  >;
  let logger: jest.Mocked<Pick<LoggerService, 'log'>>;

  beforeEach(() => {
    channelService = {
      handle: jest.fn().mockResolvedValue(undefined),
    };
    channelDownloadService = {
      download: jest.fn(),
    };
    logger = {
      log: jest.fn(),
    };

    controller = new WebhookController(
      channelService as unknown as ChannelService,
      channelDownloadService as unknown as ChannelDownloadService,
      logger as unknown as LoggerService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates source requests without workflow id', async () => {
    const sourceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const req = { method: 'POST' } as unknown as Request;
    const res = {} as Response;

    await controller.handlePost(sourceId, req, res);

    expect(channelService.handle).toHaveBeenCalledWith(
      sourceId,
      req,
      res,
      undefined,
    );
  });

  it('delegates source requests with explicit workflow id', async () => {
    const sourceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const workflowId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    const req = { method: 'POST' } as unknown as Request;
    const res = {} as Response;

    await controller.handlePostWithWorkflow(sourceId, workflowId, req, res);

    expect(channelService.handle).toHaveBeenCalledWith(
      sourceId,
      req,
      res,
      workflowId,
    );
  });

  it('delegates download requests to channel download service', async () => {
    const sourceId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
    const req = {} as Request;
    channelDownloadService.download.mockResolvedValue('stream' as any);

    const result = await controller.handleDownload(
      sourceId,
      'file.txt',
      'token',
      req,
    );

    expect(channelDownloadService.download).toHaveBeenCalledWith(
      sourceId,
      'token',
      req,
    );
    expect(result).toBe('stream');
  });
});

describe('WebhookController (HTTP pipes)', () => {
  let app: INestApplication;
  let channelService: jest.Mocked<Pick<ChannelService, 'handle'>>;
  let channelDownloadService: jest.Mocked<
    Pick<ChannelDownloadService, 'download'>
  >;
  let logger: jest.Mocked<Pick<LoggerService, 'log'>>;

  beforeAll(async () => {
    channelService = {
      handle: jest.fn(async (_sourceId, _req, res: Response) => {
        res.status(204).send();
      }),
    };
    channelDownloadService = {
      download: jest.fn(),
    };
    logger = {
      log: jest.fn(),
    };

    const { module } = await buildTestingMocks({
      controllers: [WebhookController],
      providers: [
        { provide: ChannelService, useValue: channelService },
        { provide: ChannelDownloadService, useValue: channelDownloadService },
        { provide: LoggerService, useValue: logger },
      ],
    });

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects malformed source id on GET before controller logic', async () => {
    await request(app.getHttpServer()).get('/webhook/not-a-uuid').expect(404);

    expect(channelService.handle).not.toHaveBeenCalled();
  });

  it('rejects malformed source id on POST before controller logic', async () => {
    await request(app.getHttpServer())
      .post('/webhook/not-a-uuid')
      .send({ text: 'hello' })
      .expect(404);

    expect(channelService.handle).not.toHaveBeenCalled();
  });

  it('rejects malformed workflow id on GET before controller logic', async () => {
    await request(app.getHttpServer())
      .get('/webhook/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/not-a-uuid')
      .expect(404);

    expect(channelService.handle).not.toHaveBeenCalled();
  });

  it('rejects malformed workflow id on POST before controller logic', async () => {
    await request(app.getHttpServer())
      .post('/webhook/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/not-a-uuid')
      .send({ text: 'hello' })
      .expect(404);

    expect(channelService.handle).not.toHaveBeenCalled();
  });
});
