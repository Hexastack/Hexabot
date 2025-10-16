/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { OutgoingMessageFormat } from '@/chat/schemas/types/message';
import { ContentOptions } from '@/chat/schemas/types/options';
import { LoggerService } from '@/logger/logger.service';
import { FieldType } from '@/setting/types';

import { ContentCreateDto } from '../dto/content.dto';
import { ContentType } from '../entities/content-type.entity';
import { Content } from '../entities/content.entity';
import { ContentRepository } from '../repositories/content.repository';

import { ContentService } from './content.service';

const createContent = (overrides: Partial<Content> = {}): Content =>
  Object.assign(new Content(), {
    id: 'content-id',
    entity: 'content-type-id',
    title: 'Sample content',
    status: true,
    dynamicFields: { subtitle: 'Subtitle' },
    rag: 'subtitle : Subtitle',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

const createContentType = (overrides: Partial<ContentType> = {}): ContentType =>
  Object.assign(new ContentType(), {
    id: 'content-type-id',
    name: 'Sample Type',
    fields: [
      {
        name: 'title',
        label: 'Title',
        type: FieldType.text,
      },
      {
        name: 'status',
        label: 'Status',
        type: FieldType.checkbox,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('ContentService', () => {
  let service: ContentService;
  let repository: any;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    repository = {
      find: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findOneOrCreate: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
      deleteOne: jest.fn(),
      update: jest.fn(),
      updateOne: jest.fn(),
      textSearch: jest.fn(),
      findAndPopulate: jest.fn(),
      findOneAndPopulate: jest.fn(),
    };

    logger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      fatal: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    service = new ContentService(
      repository as unknown as ContentRepository,
      logger,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('returns a content with populated content type', async () => {
      const content = createContent();
      const contentType = createContentType();
      repository.findOneAndPopulate.mockResolvedValue({
        ...content,
        contentType,
      });

      const result = await service.findOneAndPopulate(content.id);

      expect(result).toEqual({
        ...content,
        contentType,
      });
    });

    it('returns null when content is not found', async () => {
      repository.findOneAndPopulate.mockResolvedValue(null);

      const result = await service.findOneAndPopulate('missing-id');

      expect(result).toBeNull();
    });
  });

  describe('findAndPopulate', () => {
    it('returns contents with populated content types', async () => {
      const content = createContent();
      const secondContent = createContent({ id: 'other-content', entity: 'other-type' });
      const contentType = createContentType();
      const otherType = createContentType({
        id: 'other-type',
        name: 'Other type',
      });

      repository.findAndPopulate.mockResolvedValue([
        { ...content, contentType },
        { ...secondContent, contentType: otherType },
      ]);

      const result = await service.findAndPopulate({}, { skip: 0, limit: 10 });

      expect(result).toEqual([
        { ...content, contentType },
        { ...secondContent, contentType: otherType },
      ]);
    });
  });

  describe('textSearch', () => {
    it('delegates to the repository', async () => {
      const results = [createContent()];
      repository.textSearch.mockResolvedValue(results);

      await service.textSearch('query');

      expect(repository.textSearch).toHaveBeenCalledWith('query');
    });
  });

  describe('getContent', () => {
    const options: ContentOptions = {
      display: OutgoingMessageFormat.list,
      buttons: [],
      fields: {
        title: 'title',
        subtitle: null,
        image_url: null,
      },
      limit: 10,
    };

    it('returns paginated content', async () => {
    const content = createContent();
    repository.count.mockResolvedValue(1 as any);
    repository.find.mockResolvedValue([content]);

    const result = await service.getContent(options, 0);

      expect(repository.count).toHaveBeenCalledWith({ status: true });
      expect(repository.find).toHaveBeenCalledWith(
        { status: true },
        expect.any(Object),
      );
      expect(result.elements).toEqual([Content.toElement(content)]);
      expect(result.pagination).toEqual({
        total: 1,
        skip: 0,
        limit: 10,
      });
    });

    it('throws when no content is found', async () => {
    repository.count.mockResolvedValue(0 as any);

      await expect(service.getContent(options, 0)).rejects.toThrow('No content found');
      expect(logger.warn).toHaveBeenCalledWith('No content found', { status: true });
    });
  });

  describe('parseAndSaveDataset', () => {
    it('parses CSV data and calls createMany', async () => {
      const csv = 'title,status,description\nFoo,true,Bar';
      const targetContentType = 'content-type-id';
      const contentType = createContentType({
        fields: [
          {
            name: 'description',
            label: 'Description',
            type: FieldType.text,
          },
        ],
      });
    repository.createMany.mockResolvedValue([]);

      await service.parseAndSaveDataset(csv, targetContentType, contentType);

      const expectedPayload: ContentCreateDto = {
        title: 'Foo',
        status: true,
        entity: targetContentType,
        dynamicFields: {
          description: 'Bar',
        },
      };

      expect(repository.createMany).toHaveBeenCalledWith([expectedPayload]);
    });
  });
});
