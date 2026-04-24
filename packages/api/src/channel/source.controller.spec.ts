/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { buildTestingMocks } from '@/utils/test/utils';

import { SourceService } from './services/source.service';
import { SourceController } from './source.controller';

const createSourceServiceMock = () => {
  return {
    canPopulate: jest.fn().mockReturnValue(false),
    find: jest.fn(),
    findAndPopulate: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
    findOneAndPopulate: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
    getRepository: jest.fn().mockReturnValue({
      repository: {
        target: {
          name: 'SourceOrmEntity',
        },
      },
    }),
  };
};

describe('SourceController', () => {
  let controller: SourceController;
  let sourceService: ReturnType<typeof createSourceServiceMock>;

  beforeEach(() => {
    sourceService = createSourceServiceMock();
    controller = new SourceController(
      sourceService as unknown as SourceService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates source creation to SourceService', async () => {
    const payload = {
      name: 'main-web',
      channel: 'web',
      settings: {},
      state: true,
      defaultWorkflow: null,
    };
    const created = { id: 'source-1', ...payload };
    sourceService.create.mockResolvedValue(created);

    const result = await controller.create(payload);

    expect(sourceService.create).toHaveBeenCalledWith(payload);
    expect(result).toEqual(created);
  });

  it('delegates source update to SourceService', async () => {
    const sourceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    const payload = { name: 'updated' };
    const updated = { id: sourceId, ...payload };
    sourceService.updateOne.mockResolvedValue(updated);

    const result = await controller.updateOne(sourceId, payload);

    expect(sourceService.updateOne).toHaveBeenCalledWith(sourceId, payload);
    expect(result).toEqual(updated);
  });
});

describe('SourceController (HTTP pipes)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const sourceService = createSourceServiceMock();
    sourceService.findOne.mockResolvedValue(null);
    sourceService.find.mockResolvedValue([]);
    sourceService.count.mockResolvedValue(0);

    const { module } = await buildTestingMocks({
      controllers: [SourceController],
      providers: [{ provide: SourceService, useValue: sourceService }],
    });

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects malformed source id before reaching controller logic', async () => {
    await request(app.getHttpServer()).get('/source/not-a-uuid').expect(404);
  });
});
