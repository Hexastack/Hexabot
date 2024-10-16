/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NotFoundException } from '@nestjs/common/exceptions';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { BlockService } from '@/chat/services/block.service';
import { LoggerService } from '@/logger/logger.service';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import { installContentFixtures } from '@/utils/test/fixtures/content';
import { contentTypeFixtures } from '@/utils/test/fixtures/contenttype';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { ContentTypeCreateDto } from '../dto/contentType.dto';
import { ContentTypeRepository } from '../repositories/content-type.repository';
import { ContentRepository } from '../repositories/content.repository';
import { ContentType, ContentTypeModel } from '../schemas/content-type.schema';
import { ContentModel } from '../schemas/content.schema';
import { ContentTypeService } from '../services/content-type.service';
import { ContentService } from '../services/content.service';

import { ContentTypeController } from './content-type.controller';

describe('ContentTypeController', () => {
  let contentTypeController: ContentTypeController;
  let contentTypeService: ContentTypeService;
  let contentService: ContentService;
  let contentType: ContentType;
  let blockService: BlockService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentTypeController],
      imports: [
        rootMongooseTestModule(installContentFixtures),
        MongooseModule.forFeature([
          ContentTypeModel,
          ContentModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        ContentTypeRepository,
        ContentRepository,
        AttachmentRepository,
        ContentTypeService,
        ContentService,
        AttachmentService,
        LoggerService,
        EventEmitter2,
        {
          provide: BlockService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();
    blockService = module.get<BlockService>(BlockService);
    contentTypeController = module.get<ContentTypeController>(
      ContentTypeController,
    );
    contentTypeService = module.get<ContentTypeService>(ContentTypeService);
    contentService = module.get<ContentService>(ContentService);
    contentType = await contentTypeService.findOne({ name: 'Product' });
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    it('should return all contentTypes', async () => {
      const pageQuery = getPageQuery<ContentType>({ sort: ['_id', 'asc'] });
      jest.spyOn(contentTypeService, 'findPage');
      const result = await contentTypeController.findPage(pageQuery, {});
      expect(contentTypeService.findPage).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toHaveLength(contentTypeFixtures.length);
      expect(result).toEqualPayload(contentTypeFixtures);
    });
  });

  describe('create', () => {
    it('should create a new Content type', async () => {
      const newContentType: ContentTypeCreateDto = {
        name: 'House',
        fields: [
          {
            name: 'address',
            label: 'Address',
            type: 'text',
          },
          {
            name: 'image',
            label: 'Image',
            type: 'file',
          },
          {
            name: 'description',
            label: 'Description',
            type: 'html',
          },
          {
            name: 'rooms',
            label: 'Rooms',
            type: 'file',
          },
          {
            name: 'price',
            label: 'Price',
            type: 'file',
          },
        ],
      };
      jest.spyOn(contentTypeService, 'create');
      const result = await contentTypeController.create(newContentType);
      expect(contentTypeService.create).toHaveBeenCalledWith(newContentType);
      expect(result).toEqualPayload(newContentType);
    });
  });

  describe('findOne', () => {
    it('should find a content type by id', async () => {
      jest.spyOn(contentTypeService, 'findOne');
      const result = await contentTypeController.findOne(contentType.id);
      expect(contentTypeService.findOne).toHaveBeenCalledWith(contentType.id);
      expect(result).toEqualPayload(
        contentTypeFixtures.find(({ name }) => name === 'Product'),
      );
    });

    it('should throw NotFoundException when finding content type by non-existing ID', async () => {
      jest.spyOn(contentTypeService, 'findOne');
      await expect(contentTypeController.findOne(NOT_FOUND_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(contentTypeService.findOne).toHaveBeenCalledWith(NOT_FOUND_ID);
    });
  });

  describe('update', () => {
    const updatedContent = { name: 'modified' };
    it('should update and return the updated content type', async () => {
      jest.spyOn(contentTypeService, 'updateOne');
      const result = await contentTypeController.updateOne(
        updatedContent,
        contentType.id,
      );
      expect(contentTypeService.updateOne).toHaveBeenCalledWith(
        contentType.id,
        updatedContent,
      );
      expect(result).toEqualPayload({
        ...contentTypeFixtures.find(({ name }) => name === 'Product'),
        ...updatedContent,
      });
    });

    it('should throw NotFoundException if the content type is not found', async () => {
      jest.spyOn(contentTypeService, 'updateOne');
      await expect(
        contentTypeController.updateOne(updatedContent, NOT_FOUND_ID),
      ).rejects.toThrow(NotFoundException);
      expect(contentTypeService.updateOne).toHaveBeenCalledWith(
        NOT_FOUND_ID,
        updatedContent,
      );
    });
  });

  describe('remove', () => {
    it('should delete and return the deletion result', async () => {
      jest.spyOn(contentTypeService, 'deleteCascadeOne');
      const contentType = await contentTypeService.findOne({
        name: 'Restaurant',
      });
      const result = await contentTypeController.deleteOne(contentType.id);
      expect(contentTypeService.deleteCascadeOne).toHaveBeenCalledWith(
        contentType.id,
      );
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });

      await expect(
        contentTypeController.findOne(contentType.id),
      ).rejects.toThrow(NotFoundException);

      expect(await contentService.find({ entity: contentType.id })).toEqual([]);
    });

    it('should throw NotFoundException if the content type is not found', async () => {
      jest.spyOn(blockService, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(contentTypeService, 'deleteCascadeOne');
      await expect(
        contentTypeController.deleteOne(NOT_FOUND_ID),
      ).rejects.toThrow(NotFoundException);
      expect(contentTypeService.deleteCascadeOne).toHaveBeenCalledWith(
        NOT_FOUND_ID,
      );
    });
  });
});
