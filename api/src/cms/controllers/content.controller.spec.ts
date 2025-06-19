/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NotFoundException } from '@nestjs/common/exceptions';

import { I18nService } from '@/i18n/services/i18n.service';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import { getUpdateOneError } from '@/utils/test/errors/messages';
import {
  contentFixtures,
  installContentFixtures,
} from '@/utils/test/fixtures/content';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentCreateDto } from '../dto/content.dto';
import { ContentType } from '../schemas/content-type.schema';
import { Content } from '../schemas/content.schema';
import { ContentTypeService } from '../services/content-type.service';
import { ContentService } from '../services/content.service';

import { ContentController } from './content.controller';

describe('ContentController', () => {
  let contentController: ContentController;
  let contentService: ContentService;
  let contentTypeService: ContentTypeService;
  let contentType: ContentType | null;
  let content: Content | null;
  let updatedContent;
  let pageQuery: PageQueryDto<Content>;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [ContentController],
      imports: [rootMongooseTestModule(installContentFixtures)],
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [contentController, contentService, contentTypeService] = await getMocks([
      ContentController,
      ContentService,
      ContentTypeService,
    ]);
    contentType = await contentTypeService.findOne({ name: 'Product' });
    content = await contentService.findOne({
      title: 'Jean',
    });

    pageQuery = getPageQuery<Content>({
      limit: 1,
      sort: ['_id', 'asc'],
    });
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOne', () => {
    it('should find content by ID', async () => {
      const contentType = await contentTypeService.findOne(content!.entity);
      jest.spyOn(contentService, 'findOne');
      const result = await contentController.findOne(content!.id, []);
      expect(contentService.findOne).toHaveBeenCalledWith(content!.id);
      expect(result).toEqualPayload({
        ...contentFixtures.find(({ title }) => title === 'Jean'),
        entity: contentType!.id,
      });
    });

    it('should throw NotFoundException when finding content by non-existing ID', async () => {
      jest.spyOn(contentService, 'findOne');
      await expect(contentController.findOne(NOT_FOUND_ID, [])).rejects.toThrow(
        NotFoundException,
      );
      expect(contentService.findOne).toHaveBeenCalledWith(NOT_FOUND_ID);
    });

    it('should find content by ID and populate its corresponding content type', async () => {
      const result = await contentController.findOne(content!.id, ['entity']);
      const contentType = await contentTypeService.findOne(content!.entity);

      expect(result).toEqualPayload({
        ...contentFixtures.find(({ title }) => title === 'Jean'),
        entity: contentType,
      });
    });
  });

  describe('findPage', () => {
    it('should find all contents', async () => {
      const result = await contentController.findPage(pageQuery, [], {});
      expect(result).toEqualPayload([
        {
          ...contentFixtures.find(({ title }) => title === 'Jean'),
          entity: contentType!.id,
        },
      ]);
    });

    it('should find all contents and populate the corresponding content types', async () => {
      const result = await contentController.findPage(
        pageQuery,
        ['entity'],
        {},
      );
      expect(result).toEqualPayload([
        {
          ...contentFixtures.find(({ title }) => title === 'Jean'),
          entity: contentType,
        },
      ]);
    });
  });

  describe('findByType', () => {
    it('should find contents by content type', async () => {
      const result = await contentController.findByType(
        contentType!.id,
        pageQuery,
      );
      const contents = contentFixtures.filter(({ entity }) => entity === '0');
      contents.reduce((acc, curr) => {
        if (contentType?.id) {
          curr['entity'] = contentType.id;
        }
        return acc;
      }, []);
      expect(result).toEqualPayload([contents[0]]);
    });
  });

  describe('update', () => {
    it('should update and return the updated content', async () => {
      const contentType = await contentTypeService.findOne(content!.entity);
      updatedContent = {
        ...contentFixtures.find(({ title }) => title === 'Jean'),
        entity: contentType!.id,
        title: 'modified Jean',
      };
      const result = await contentController.updateOne(
        updatedContent,
        content!.id,
      );

      expect(result).toEqualPayload(updatedContent, [
        'rag',
        ...IGNORED_TEST_FIELDS,
      ]);
    });

    it('should throw NotFoundException if the content is not found', async () => {
      await expect(
        contentController.updateOne(updatedContent, NOT_FOUND_ID),
      ).rejects.toThrow(getUpdateOneError(Content.name, NOT_FOUND_ID));
    });
  });

  describe('deleteOne', () => {
    it('should delete an existing Content', async () => {
      const content = await contentService.findOne({ title: 'Adaptateur' });
      const result = await contentService.deleteOne(content!.id);
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });
  });

  describe('create', () => {
    it('should create a new Content', async () => {
      const newContent: ContentCreateDto = {
        title: 'Bluetooth Headphones',
        dynamicFields: {
          subtitle:
            'Sony WH-1000XM4 Wireless Noise-Cancelling Headphones, Black',
          image: {
            payload: {
              url: 'https://images-eu.ssl-images-amazon.com/images/I/61D4ZlSgmRL._SL1500_.jpg',
            },
          },
        },
        entity: contentType!.id,
        status: true,
      };
      jest.spyOn(contentService, 'create');
      const result = await contentController.create(newContent);
      expect(contentService.create).toHaveBeenCalledWith(newContent);
      expect(result).toEqualPayload(newContent, [
        'rag',
        ...IGNORED_TEST_FIELDS,
      ]);
    });
  });

  describe('count', () => {
    it('should return the number of contents', async () => {
      jest.spyOn(contentService, 'count');
      const result = await contentController.filterCount();
      expect(contentService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: contentFixtures.length });
    });
  });

  describe('import', () => {
    const mockCsvData: string = `other,title,status,image
      should not appear,store 3,true,image.jpg`;

    const file: Express.Multer.File = {
      buffer: Buffer.from(mockCsvData, 'utf-8'),
      originalname: 'test.csv',
      mimetype: 'text/csv',
      size: mockCsvData.length,
      fieldname: 'file',
      encoding: '7bit',
      stream: null,
      destination: '',
      filename: '',
      path: '',
    } as unknown as Express.Multer.File;

    it('should import content from a CSV file', async () => {
      const mockContentType = {
        id: '0',
        name: 'Store',
      } as unknown as ContentType;
      jest
        .spyOn(contentTypeService, 'findOne')
        .mockResolvedValueOnce(mockContentType);
      jest.spyOn(contentService, 'parseAndSaveDataset').mockResolvedValueOnce([
        {
          entity: mockContentType.id,
          title: 'store 3',
          status: true,
          dynamicFields: {
            image: 'image.jpg',
          },
          id: '',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await contentController.import(file, mockContentType.id);
      expect(contentService.parseAndSaveDataset).toHaveBeenCalledWith(
        mockCsvData,
        mockContentType.id,
        mockContentType,
      );
      expect(result).toEqualPayload([
        {
          entity: mockContentType.id,
          title: 'store 3',
          status: true,
          dynamicFields: {
            image: 'image.jpg',
          },
          id: '',
        },
      ]);
    });

    it('should throw NotFoundException if content type is not found', async () => {
      jest.spyOn(contentTypeService, 'findOne').mockResolvedValueOnce(null);
      await expect(
        contentController.import(file, 'INVALID_ID'),
      ).rejects.toThrow(new NotFoundException('Content type is not found'));
    });

    it('should throw NotFoundException if idTargetContentType is missing', async () => {
      await expect(contentController.import(file, '')).rejects.toThrow(
        new NotFoundException('Missing parameter'),
      );
    });
  });
});
