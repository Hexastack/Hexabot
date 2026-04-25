/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2026 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException } from '@nestjs/common';
import z from 'zod';

import { WorkflowService } from '@/workflow/services/workflow.service';

import { SourceRepository } from '../repositories/source.repository';

import { ChannelRegistry } from './channel-registry.service';
import { SourceService } from './source.service';

describe('SourceService', () => {
  let service: SourceService;
  let repository: jest.Mocked<Pick<SourceRepository, 'create' | 'updateOne'>>;
  let channelRegistry: jest.Mocked<Pick<ChannelRegistry, 'findChannel'>>;
  let workflowService: jest.Mocked<Pick<WorkflowService, 'findOne'>>;

  const registerSchema = (schema: z.ZodTypeAny) => {
    channelRegistry.findChannel.mockReturnValue({
      getSourceSettingsSchema: jest.fn().mockReturnValue(schema),
    } as any);
  };

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      updateOne: jest.fn(),
    };
    channelRegistry = {
      findChannel: jest.fn(),
    };
    workflowService = {
      findOne: jest.fn(),
    };
    registerSchema(z.strictObject({}));

    service = new SourceService(
      repository as unknown as SourceRepository,
      channelRegistry as unknown as ChannelRegistry,
      workflowService as unknown as WorkflowService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes settings using handler zod schema defaults', () => {
    registerSchema(
      z.strictObject({
        allowed_domains: z.string().default('https://example.com'),
      }),
    );

    const settings = service.normalizeSettings('web', {});

    expect(settings).toEqual({
      allowed_domains: 'https://example.com',
    });
  });

  it('rejects invalid source settings for channels with schema', () => {
    registerSchema(
      z.strictObject({
        allowed_domains: z.string(),
      }),
    );

    expect(() =>
      service.normalizeSettings('web', {
        allowed_domains: 123,
      }),
    ).toThrow(BadRequestException);
  });

  it('rejects source settings when channel handler is not registered', () => {
    channelRegistry.findChannel.mockReturnValue(undefined);

    expect(() =>
      service.normalizeSettings('custom-channel', {
        any: 'value',
      }),
    ).toThrow(
      new BadRequestException('Channel "custom-channel" is not registered'),
    );
  });

  it('creates default active source payload with normalized settings', async () => {
    registerSchema(
      z.strictObject({
        enabled: z.boolean().default(true),
      }),
    );
    repository.create.mockResolvedValue({ id: 'source-1' } as any);

    await service.create({
      name: 'main-web',
      channel: 'web',
      settings: {},
    });

    expect(repository.create).toHaveBeenCalledWith({
      name: 'main-web',
      channel: 'web',
      settings: { enabled: true },
      state: true,
      defaultWorkflow: null,
    });
  });

  it('rejects source creation when default workflow does not exist', async () => {
    const workflowId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    workflowService.findOne.mockResolvedValue(null);

    await expect(
      service.create({
        name: 'main-web',
        channel: 'web',
        settings: {},
        defaultWorkflow: workflowId,
      }),
    ).rejects.toThrow(`Workflow with ID ${workflowId} not found`);

    expect(repository.create).not.toHaveBeenCalled();
  });

  it('validates default workflow before updating source', async () => {
    const sourceId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const workflowId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: sourceId,
      channel: 'web',
      settings: {},
      defaultWorkflow: null,
      state: true,
    } as any);
    workflowService.findOne.mockResolvedValue({ id: workflowId } as any);
    repository.updateOne.mockResolvedValue({
      id: sourceId,
      defaultWorkflow: workflowId,
    } as any);

    await service.updateOne(sourceId, { defaultWorkflow: workflowId });

    expect(workflowService.findOne).toHaveBeenCalledWith(workflowId);
    expect(repository.updateOne).toHaveBeenCalledWith(
      sourceId,
      expect.objectContaining({
        channel: 'web',
        settings: {},
        defaultWorkflow: workflowId,
      }),
      undefined,
    );
  });

  it('creates one default source per channel when none exists', async () => {
    const findOneSpy = jest.spyOn(service, 'findOne');
    const createSpy = jest.spyOn(service, 'create').mockResolvedValue({
      id: 'source-1',
    } as any);

    findOneSpy
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing-source' } as any);

    await service.ensureDefaultSources(['web', 'console']);

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith({
      name: 'Web',
      channel: 'web',
      settings: {},
      state: true,
      defaultWorkflow: null,
    });
  });

  it('rejects physical deletion of sources', async () => {
    await expect(service.deleteOne('source-id')).rejects.toThrow(
      'Sources cannot be deleted. Disable the source instead.',
    );
    await expect(service.deleteMany()).rejects.toThrow(
      'Sources cannot be deleted. Disable the source instead.',
    );
  });
});
