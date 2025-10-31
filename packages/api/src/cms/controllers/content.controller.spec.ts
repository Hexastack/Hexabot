/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

import { BlockService } from '@/chat/services/block.service';
import { LoggerService } from '@/logger/logger.service';
import {
  contentFixtures,
  installContentFixturesTypeOrm,
} from '@/utils/test/fixtures/content';
import { installContentTypeFixturesTypeOrm } from '@/utils/test/fixtures/contenttype';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentTypeOrmEntity } from '../entities/content-type.entity';
import { ContentOrmEntity } from '../entities/content.entity';
import { ContentTypeRepository } from '../repositories/content-type.repository';
import { ContentRepository } from '../repositories/content.repository';
import { ContentTypeService } from '../services/content-type.service';
import { ContentService } from '../services/content.service';

import { ContentController } from './content.controller';

describe('ContentController (TypeORM)', () => {
  let module: TestingModule;
  let controller: ContentController;
  let contentService: ContentService;
  let contentTypeService: ContentTypeService;
  let logger: LoggerService;
  const createdContentIds = new Set<string>();
  const blockServiceMock = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      controllers: [ContentController],
      providers: [
        ContentService,
        ContentTypeService,
        ContentRepository,
        ContentTypeRepository,
        {
          provide: BlockService,
          useFactory: () => blockServiceMock,
        },
      ],
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
    [controller, contentService, contentTypeService] = await getMocks([
      ContentController,
      ContentService,
      ContentTypeService,
    ]);
    logger = (controller as any).logger as LoggerService;
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    for (const id of Array.from(createdContentIds)) {
      await contentService.deleteOne(id);
      createdContentIds.delete(id);
    }
  });

  describe('create', () => {
    it('creates content when content type exists', async () => {
      const contentType = await contentTypeService.findOne({
        where: { name: 'Product' },
      });
      expect(contentType).toBeDefined();

      const created = await controller.create({
        title: 'New content',
        contentType: contentType!.id,
        status: true,
        dynamicFields: { subtitle: 'Test' },
      });
      createdContentIds.add(created.id);

      expect(created).toMatchObject({
        title: 'New content',
        contentType: contentType!.id,
        status: true,
        dynamicFields: { subtitle: 'Test' },
      });
    });

    it('throws when content type is invalid', async () => {
      await expect(
        controller.create({
          title: 'Invalid',
          contentType: randomUUID(),
          status: true,
          dynamicFields: {},
        }),
      ).rejects.toThrow();
    });
  });

  describe('find', () => {
    it('retrieves content without populate', async () => {
      const result = await controller.find([], { take: 5, skip: 0 });

      expect(result.length).toBeGreaterThan(0);
    });

    it('retrieves populated content when requested', async () => {
      const findAndPopulateSpy = jest.spyOn(contentService, 'findAndPopulate');

      const result = await controller.find(['contentType'], {
        take: 5,
        skip: 0,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(findAndPopulateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ take: 5, skip: 0 }),
      );
      expect(findAndPopulateSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('filterCount', () => {
    it('returns count of matching contents', async () => {
      const [existing] = await contentService.find({ take: 1 });
      expect(existing).toBeDefined();

      const result = await controller.filterCount({
        where: { contentType: { id: existing.contentType } },
      });

      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('returns content without populate', async () => {
      const [existing] = await contentService.find({ take: 1 });
      expect(existing).toBeDefined();

      const found = await controller.findOne(existing.id, []);

      expect(found).toMatchObject({ id: existing.id });
    });

    it('returns populated content when allowed', async () => {
      const [existing] = await contentService.find({ take: 1 });
      expect(existing).toBeDefined();

      const findOneAndPopulateSpy = jest.spyOn(
        contentService,
        'findOneAndPopulate',
      );

      const found = await controller.findOne(existing.id, ['contentType']);

      expect(found).toMatchObject({ id: existing.id });
      expect(findOneAndPopulateSpy).toHaveBeenCalledWith(existing.id);
    });

    it('throws when content is missing', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(
        controller.findOne('00000000-0000-4000-8000-000000000000', []),
      ).rejects.toThrow(NotFoundException);

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('findByType', () => {
    it('returns contents for a given content type', async () => {
      const [fixture] = contentFixtures;
      const type = await contentTypeService.findOne({
        where: { name: 'Product' },
      });
      expect(type).toBeDefined();

      const result = await controller.findByType(type!.id, {
        take: 10,
        skip: 0,
      });

      expect(result.length).toBeGreaterThan(0);
      expect(result.some((content) => content.title === fixture.title)).toBe(
        true,
      );
    });

    it('throws when content type does not exist', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(
        controller.findByType('00000000-0000-4000-8000-000000000001', {
          take: 10,
          skip: 0,
        }),
      ).rejects.toThrow(NotFoundException);

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('updateOne', () => {
    it('updates existing content', async () => {
      const contentType = await contentTypeService.findOne({
        where: { name: 'Product' },
      });
      const created = await controller.create({
        title: 'To update',
        contentType: contentType!.id,
        status: true,
        dynamicFields: {},
      });
      createdContentIds.add(created.id);

      const updated = await controller.updateOne(
        { title: 'Updated title' },
        created.id,
      );

      expect(updated.title).toBe('Updated title');
    });
  });

  describe('deleteOne', () => {
    it('deletes existing content', async () => {
      const contentType = await contentTypeService.findOne({
        where: { name: 'Product' },
      });
      const created = await controller.create({
        title: 'To delete',
        contentType: contentType!.id,
        status: true,
        dynamicFields: {},
      });

      const result = await controller.deleteOne(created.id);

      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
      const found = await contentService.findOne(created.id);
      expect(found).toBeNull();
    });

    it('throws when nothing is deleted', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(
        controller.deleteOne('00000000-0000-4000-8000-000000000002'),
      ).rejects.toThrow(NotFoundException);

      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
