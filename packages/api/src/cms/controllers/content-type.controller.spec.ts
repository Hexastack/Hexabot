/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { NotFoundException } from '@nestjs/common';

import { FieldType } from '@/setting/types';
import { LoggerService } from '@/logger/logger.service';

import {
  ContentTypeCreateDto,
  ContentTypeUpdateDto,
} from '../dto/contentType.dto';
import { ContentType } from '../entities/content-type.entity';
import { ContentTypeService } from '../services/content-type.service';

import { ContentTypeController } from './content-type.controller';

const createLoggerMock = (): jest.Mocked<LoggerService> =>
  ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
  }) as unknown as jest.Mocked<LoggerService>;

const createContentType = (overrides: Partial<ContentType> = {}) =>
  Object.assign(new ContentType(), {
    id: 'type-1',
    name: 'Product',
    fields: [
      { name: 'title', label: 'Title', type: FieldType.text },
      { name: 'status', label: 'Status', type: FieldType.checkbox },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('ContentTypeController', () => {
  let controller: ContentTypeController;
  let service: jest.Mocked<ContentTypeService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    service = {
      create: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      findOne: jest.fn(),
      updateOne: jest.fn(),
      deleteCascadeOne: jest.fn(),
    } as unknown as jest.Mocked<ContentTypeService>;

    logger = createLoggerMock();
    controller = new ContentTypeController(service, logger);
  });

  const contentType = createContentType();

  describe('create', () => {
    it('delegates creation to the service', async () => {
      const payload: ContentTypeCreateDto = {
        name: 'House',
        fields: [
          { name: 'address', label: 'Address', type: FieldType.text },
          { name: 'image', label: 'Image', type: FieldType.file },
        ],
      };
      service.create.mockResolvedValue(createContentType(payload));

      const result = await controller.create(payload);

      expect(service.create).toHaveBeenCalledWith(payload);
      expect(result.name).toBe(payload.name);
    });
  });

  describe('findPage', () => {
    it('returns paginated content types', async () => {
      service.find.mockResolvedValue([contentType]);

      const result = await controller.findPage({ limit: 10, skip: 0 }, {});

      expect(service.find).toHaveBeenCalledWith({}, { limit: 10, skip: 0 });
      expect(result).toEqual([contentType]);
    });
  });

  describe('filterCount', () => {
    it('returns count from the service', async () => {
      service.count.mockResolvedValue(3);

      const result = await controller.filterCount({});

      expect(result).toEqual({ count: 3 });
    });
  });

  describe('findOne', () => {
    it('returns the requested content type', async () => {
      service.findOne.mockResolvedValue(contentType);

      const result = await controller.findOne(contentType.id);

      expect(service.findOne).toHaveBeenCalledWith(contentType.id);
      expect(result).toBe(contentType);
    });

    it('throws NotFoundException when entity is missing', async () => {
      service.findOne.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(logger.warn).toHaveBeenCalled();
    });
  });

  describe('updateOne', () => {
    it('updates the content type via the service', async () => {
      const payload: ContentTypeUpdateDto = { name: 'Updated' };
      const updated = createContentType({ id: contentType.id, ...payload });
      service.updateOne.mockResolvedValue(updated);

      const result = await controller.updateOne(payload, contentType.id);

      expect(service.updateOne).toHaveBeenCalledWith(contentType.id, payload);
      expect(result).toBe(updated);
    });
  });

  describe('deleteOne', () => {
    it('returns deletion result when entity exists', async () => {
      service.deleteCascadeOne.mockResolvedValue({
        acknowledged: true,
        deletedCount: 1,
      });

      const result = await controller.deleteOne(contentType.id);

      expect(service.deleteCascadeOne).toHaveBeenCalledWith(contentType.id);
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });

    it('throws NotFoundException when nothing is deleted', async () => {
      service.deleteCascadeOne.mockResolvedValue({
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
