/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { OutgoingMessageFormat } from '@/chat/schemas/types/message';
import { ContentOptions } from '@/chat/schemas/types/options';
import { LoggerService } from '@/logger/logger.service';
import { FieldType } from '@/setting/types';
import {
  contentFixtures,
  installContentFixturesTypeOrm,
} from '@/utils/test/fixtures/content';
import { installContentTypeFixturesTypeOrm } from '@/utils/test/fixtures/contenttype';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentType } from '../dto/contentType.dto';
import { ContentTypeOrmEntity } from '../entities/content-type.entity';
import { ContentOrmEntity } from '../entities/content.entity';
import { ContentRepository } from '../repositories/content.repository';

import { ContentService } from './content.service';

describe('ContentService (TypeORM)', () => {
  let module: TestingModule;
  let contentService: ContentService;
  let logger: LoggerService;
  const createdContentIds: string[] = [];

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      providers: [ContentService, ContentRepository],
      typeorm: [
        {
          entities: [ContentOrmEntity, ContentTypeOrmEntity],
          fixtures: [
            installContentTypeFixturesTypeOrm,
            installContentFixturesTypeOrm,
          ],
        },
      ],
    });
    module = testingModule;
    [contentService] = await getMocks([ContentService]);
    logger = (contentService as any).logger as LoggerService;
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (createdContentIds.length > 0) {
      await Promise.all(
        createdContentIds.map(async (id) => {
          await contentService.deleteOne(id);
        }),
      );
      createdContentIds.length = 0;
    }
  });

  describe('findOneAndPopulate', () => {
    it('returns a content with its content type', async () => {
      const targetTitle = contentFixtures[0].title;
      const [target] = await contentService.find({
        where: { title: targetTitle },
        take: 1,
      });
      expect(target).toBeDefined();

      const result = await contentService.findOneAndPopulate(target.id);

      expect(result).toBeDefined();
      expect(result?.title).toBe(targetTitle);
      expect(result?.entity).toBe(target.entity);
    });

    it('returns null when content is missing', async () => {
      const result = await contentService.findOneAndPopulate(
        '00000000-0000-4000-8000-000000000000',
      );

      expect(result).toBeNull();
    });
  });

  describe('findAndPopulate', () => {
    it('returns contents with their types', async () => {
      const results = await contentService.findAndPopulate({
        take: 5,
        skip: 0,
      });

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every((content) => typeof content.entity === 'string'),
      ).toBe(true);
    });
  });

  describe('textSearch', () => {
    it('matches content by keyword', async () => {
      const keyword = contentFixtures[0].title.split(' ')[0].toLowerCase();

      const results = await contentService.textSearch(keyword);

      expect(
        results.some((content) => content.title === contentFixtures[0].title),
      ).toBe(true);
    });
  });

  describe('getContent', () => {
    const baseOptions: ContentOptions = {
      display: OutgoingMessageFormat.list,
      buttons: [],
      fields: {
        title: 'title',
        subtitle: null,
        image_url: null,
      },
      limit: 3,
    };

    it('returns paginated content list ordered by creation date', async () => {
      const total = await contentService.count({ status: true });
      const result = await contentService.getContent(baseOptions, 0);

      expect(result.elements.length).toBeGreaterThan(0);
      expect(result.pagination).toEqual({
        total,
        skip: 0,
        limit: baseOptions.limit,
      });
    });

    it('throws when no content matches the query', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');
      const errorSpy = jest.spyOn(logger, 'error');

      await expect(
        contentService.getContent(
          {
            ...baseOptions,
            entity: '00000000-0000-4000-8000-000000000001',
          },
          0,
        ),
      ).rejects.toThrow('No content found');

      expect(warnSpy).toHaveBeenCalledWith('No content found', {
        status: true,
        entity: '00000000-0000-4000-8000-000000000001',
      });
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('parseAndSaveDataset', () => {
    it('stores rows parsed from CSV as content records', async () => {
      const [existingContent] = await contentService.find({ take: 1 });
      expect(existingContent).toBeDefined();

      const csv =
        'title,status,description,subtitle\nDemo,true,Description,Subtitle';
      const dtoContentType = {
        fields: [
          {
            name: 'description',
            label: 'Description',
            type: FieldType.text,
          },
          {
            name: 'subtitle',
            label: 'Subtitle',
            type: FieldType.text,
          },
        ],
      } as unknown as ContentType;

      const created = await contentService.parseAndSaveDataset(
        csv,
        existingContent!.entity,
        dtoContentType,
      );

      expect(created).toBeDefined();
      if (!created) {
        throw new Error('Expected dataset parsing to create content records');
      }

      createdContentIds.push(...created.map((content) => content.id));
      expect(created).toHaveLength(1);
      expect(created[0]).toMatchObject({
        title: 'Demo',
        entity: existingContent!.entity,
        status: true,
        dynamicFields: {
          description: 'Description',
          subtitle: 'Subtitle',
        },
      });
    });
  });
});
