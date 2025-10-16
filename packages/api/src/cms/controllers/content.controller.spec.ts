/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { ContentCreateDto } from '../dto/content.dto';
import { Content } from '../entities/content.entity';
import { ContentService } from '../services/content.service';
import { ContentTypeService } from '../services/content-type.service';

import { ContentController } from './content.controller';

const createLoggerMock = (): jest.Mocked<LoggerService> =>
  ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
  }) as unknown as jest.Mocked<LoggerService>;

const createContent = (overrides: Partial<Content> = {}): Content =>
  Object.assign(new Content(), {
    id: 'content-1',
    entity: 'type-1',
    title: 'Sample',
    status: true,
    dynamicFields: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('ContentController', () => {
  let controller: ContentController;
  let contentService: jest.Mocked<ContentService>;
  let contentTypeService: jest.Mocked<ContentTypeService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    contentService = {
      canPopulate: jest.fn(),
      find: jest.fn(),
      findAndPopulate: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      findOneAndPopulate: jest.fn(),
      deleteOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
    } as unknown as jest.Mocked<ContentService>;

    contentService.find.mockResolvedValue([]);

    contentTypeService = {
      findOne: jest.fn(),
    } as unknown as jest.Mocked<ContentTypeService>;
    contentTypeService.findOne.mockResolvedValue({ id: content.entity } as any);

    logger = createLoggerMock();

    controller = new ContentController(
      contentService,
      contentTypeService,
      logger,
    );
  });

  const content = createContent();

  describe('create', () => {
    it('creates content when entity is valid', async () => {
      const payload: ContentCreateDto = {
        title: 'New content',
        entity: content.entity,
        status: true,
        dynamicFields: {},
      };

      contentTypeService.findOne.mockResolvedValue({ id: content.entity } as any);
      contentService.create.mockResolvedValue(createContent(payload));

      const result = await controller.create(payload);

      expect(contentTypeService.findOne).toHaveBeenCalledWith(payload.entity);
      expect(contentService.create).toHaveBeenCalledWith(payload);
      expect(result.title).toBe(payload.title);
    });

    it('throws when entity is invalid', async () => {
      contentTypeService.findOne.mockResolvedValue(null);

      await expect(
        controller.create({
          title: 'Invalid',
          entity: 'missing',
          status: true,
          dynamicFields: {},
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findPage', () => {
    const pageQuery: PageQueryDto<Content> = { limit: 10, skip: 0 };

    it('delegates to find when populate is empty', async () => {
      contentService.canPopulate.mockReturnValue(false);
      contentService.find.mockResolvedValue([content]);

      const result = await controller.findPage(pageQuery, [], {});

      expect(contentService.find).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqual([content]);
    });

    it('delegates to findAndPopulate when populate is allowed', async () => {
      contentService.canPopulate.mockReturnValue(true);
      contentService.findAndPopulate.mockResolvedValue([content]);

      const result = await controller.findPage(pageQuery, ['entity'], {});

      expect(contentService.findAndPopulate).toHaveBeenCalledWith(
        {},
        pageQuery,
      );
      expect(result).toEqual([content]);
    });
  });

  describe('findOne', () => {
    it('returns content when found', async () => {
      contentService.canPopulate.mockReturnValue(false);
      contentService.findOne.mockResolvedValue(content);

      const result = await controller.findOne(content.id, []);

      expect(result).toBe(content);
    });

    it('returns populated content when requested', async () => {
      contentService.canPopulate.mockReturnValue(true);
      contentService.findOneAndPopulate.mockResolvedValue(content);

      const result = await controller.findOne(content.id, ['entity']);

      expect(contentService.findOneAndPopulate).toHaveBeenCalledWith(
        content.id,
      );
      expect(result).toBe(content);
    });

    it('throws when content is not found', async () => {
      contentService.canPopulate.mockReturnValue(false);
      contentService.findOne.mockResolvedValue(null);

      await expect(controller.findOne('missing', [])).rejects.toThrow(
        NotFoundException,
      );
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('filterCount', () => {
    it('returns count from service', async () => {
      contentService.count.mockResolvedValue(5);

      const result = await controller.filterCount({});

      expect(result).toEqual({ count: 5 });
    });
  });

  describe('findByType', () => {
    it('returns contents when type exists', async () => {
      contentTypeService.findOne.mockResolvedValue({ id: content.entity } as any);
      contentService.find.mockResolvedValue([content]);

      const result = await controller.findByType(content.entity, {
        limit: 10,
        skip: 0,
      });

      expect(contentService.find).toHaveBeenCalledWith(
        { entity: content.entity },
        { limit: 10, skip: 0 },
      );
      expect(result).toEqual([content]);
    });

    it('throws when content type does not exist', async () => {
      contentTypeService.findOne.mockResolvedValue(null);

      await expect(
        controller.findByType('missing', { limit: 10, skip: 0 }),
      ).rejects.toThrow(NotFoundException);
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('updateOne', () => {
    it('delegates to the service', async () => {
      contentService.updateOne.mockResolvedValue(content);

      const result = await controller.updateOne({ title: 'Updated' }, content.id);

      expect(contentService.updateOne).toHaveBeenCalledWith(content.id, {
        title: 'Updated',
      });
      expect(result).toBe(content);
    });
  });

  describe('deleteOne', () => {
    it('returns delete result when an entity was removed', async () => {
      contentService.deleteOne.mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });

      const result = await controller.deleteOne(content.id);

      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });

    it('throws when delete count is zero', async () => {
      contentService.deleteOne.mockResolvedValue({
        acknowledged: true,
        deletedCount: 0,
      });

      await expect(controller.deleteOne('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(logger.warn).toHaveBeenCalled();
    });
  });
});
