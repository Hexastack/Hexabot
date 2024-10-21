/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import fs from 'fs';

import { NotFoundException } from '@nestjs/common/exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import {
  AttachmentModel,
  Attachment,
} from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { LoggerService } from '@/logger/logger.service';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import {
  contentFixtures,
  installContentFixtures,
} from '@/utils/test/fixtures/content';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { ContentCreateDto } from '../dto/content.dto';
import { ContentTypeRepository } from '../repositories/content-type.repository';
import { ContentRepository } from '../repositories/content.repository';
import { ContentType, ContentTypeModel } from '../schemas/content-type.schema';
import { Content, ContentModel } from '../schemas/content.schema';
import { ContentTypeService } from '../services/content-type.service';
import { ContentService } from '../services/content.service';

import { ContentController } from './content.controller';

describe('ContentController', () => {
  let contentController: ContentController;
  let contentService: ContentService;
  let contentTypeService: ContentTypeService;
  let attachmentService: AttachmentService;
  let contentType: ContentType;
  let content: Content;
  let attachment: Attachment;
  let updatedContent;
  let pageQuery: PageQueryDto<Content>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentController],
      imports: [
        rootMongooseTestModule(installContentFixtures),
        MongooseModule.forFeature([
          ContentTypeModel,
          ContentModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        LoggerService,
        ContentTypeService,
        ContentService,
        ContentRepository,
        AttachmentService,
        ContentTypeRepository,
        AttachmentRepository,
        EventEmitter2,
      ],
    }).compile();
    contentController = module.get<ContentController>(ContentController);
    contentService = module.get<ContentService>(ContentService);
    attachmentService = module.get<AttachmentService>(AttachmentService);
    contentTypeService = module.get<ContentTypeService>(ContentTypeService);
    contentType = await contentTypeService.findOne({ name: 'Product' });
    content = await contentService.findOne({
      title: 'Jean',
    });
    attachment = await attachmentService.findOne({
      name: 'store1.jpg',
    });

    pageQuery = getPageQuery<Content>({
      limit: 1,
      sort: ['_id', 'asc'],
    });
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findOne', () => {
    it('should find content by ID', async () => {
      const contentType = await contentTypeService.findOne(content.entity);
      jest.spyOn(contentService, 'findOne');
      const result = await contentController.findOne(content.id, []);
      expect(contentService.findOne).toHaveBeenCalledWith(content.id);
      expect(result).toEqualPayload({
        ...contentFixtures.find(({ title }) => title === 'Jean'),
        entity: contentType.id,
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
      const result = await contentController.findOne(content.id, ['entity']);
      const contentType = await contentTypeService.findOne(content.entity);

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
          entity: contentType.id,
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
        contentType.id,
        pageQuery,
      );
      const contents = contentFixtures.filter(({ entity }) => entity === '0');
      contents.reduce((acc, curr) => {
        curr['entity'] = contentType.id;
        return acc;
      }, []);
      expect(result).toEqualPayload([contents[0]]);
    });
  });

  describe('update', () => {
    it('should update and return the updated content', async () => {
      const contentType = await contentTypeService.findOne(content.entity);
      updatedContent = {
        ...contentFixtures.find(({ title }) => title === 'Jean'),
        entity: contentType.id,
        title: 'modified Jean',
      };
      const result = await contentController.updateOne(
        updatedContent,
        content.id,
      );

      expect(result).toEqualPayload(updatedContent, [
        'rag',
        ...IGNORED_TEST_FIELDS,
      ]);
    });

    it('should throw NotFoundException if the content is not found', async () => {
      await expect(
        contentController.updateOne(updatedContent, NOT_FOUND_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOne', () => {
    it('should delete an existing Content', async () => {
      const content = await contentService.findOne({ title: 'Adaptateur' });
      const result = await contentService.deleteOne(content.id);
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
        entity: contentType.id,
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
    it('should import content from a CSV file', async () => {
      const mockCsvData: string = `other,title,status,image
should not appear,store 3,true,image.jpg`;

      const mockCsvContentDto: ContentCreateDto = {
        entity: '0',
        title: 'store 3',
        status: true,
        dynamicFields: {
          image: 'image.jpg',
        },
      };
      jest.spyOn(contentService, 'createMany');
      jest.spyOn(fs, 'existsSync').mockReturnValueOnce(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValueOnce(mockCsvData);

      const contentType = await contentTypeService.findOne({
        name: 'Store',
      });

      const result = await contentController.import({
        idFileToImport: attachment.id,
        idTargetContentType: contentType.id,
      });
      expect(contentService.createMany).toHaveBeenCalledWith([
        { ...mockCsvContentDto, entity: contentType.id },
      ]);

      expect(result).toEqualPayload(
        [
          {
            ...mockCsvContentDto,
            entity: contentType.id,
          },
        ],
        [...IGNORED_TEST_FIELDS, 'rag'],
      );
    });

    it('should throw NotFoundException if content type is not found', async () => {
      await expect(
        contentController.import({
          idFileToImport: attachment.id,
          idTargetContentType: NOT_FOUND_ID,
        }),
      ).rejects.toThrow(new NotFoundException('Content type is not found'));
    });

    it('should throw NotFoundException if file is not found in attachment database', async () => {
      const contentType = await contentTypeService.findOne({
        name: 'Product',
      });
      jest.spyOn(contentTypeService, 'findOne');
      await expect(
        contentController.import({
          idFileToImport: NOT_FOUND_ID,
          idTargetContentType: contentType.id.toString(),
        }),
      ).rejects.toThrow(new NotFoundException('File does not exist'));
    });

    it('should throw NotFoundException if file does not exist in the given path ', async () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      await expect(
        contentController.import({
          idFileToImport: attachment.id,
          idTargetContentType: contentType.id,
        }),
      ).rejects.toThrow(new NotFoundException('File does not exist'));
    });

    it.each([
      ['file param and content type params are missing', '', ''],
      ['content type param is missing', '', NOT_FOUND_ID],
      ['file param is missing', NOT_FOUND_ID, ''],
    ])(
      'should throw NotFoundException if %s',
      async (_message, fileToImport, targetContentType) => {
        await expect(
          contentController.import({
            idFileToImport: fileToImport,
            idTargetContentType: targetContentType,
          }),
        ).rejects.toThrow(new NotFoundException('Missing params'));
      },
    );
  });
});
