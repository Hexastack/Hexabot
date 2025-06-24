/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NotFoundException } from '@nestjs/common/exceptions';

import { BlockService } from '@/chat/services/block.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { FieldType } from '@/setting/schemas/types';
import { NOT_FOUND_ID } from '@/utils/constants/mock';
import { getUpdateOneError } from '@/utils/test/errors/messages';
import { installContentFixtures } from '@/utils/test/fixtures/content';
import { contentTypeFixtures } from '@/utils/test/fixtures/contenttype';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentTypeCreateDto } from '../dto/contentType.dto';
import { ContentType } from '../schemas/content-type.schema';
import { ContentTypeService } from '../services/content-type.service';
import { ContentService } from '../services/content.service';

import { ContentTypeController } from './content-type.controller';

describe('ContentTypeController', () => {
  let contentTypeController: ContentTypeController;
  let contentTypeService: ContentTypeService;
  let contentService: ContentService;
  let contentType: ContentType | null;
  let blockService: BlockService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [ContentTypeController],
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
    [blockService, contentTypeController, contentTypeService, contentService] =
      await getMocks([
        BlockService,
        ContentTypeController,
        ContentTypeService,
        ContentService,
      ]);
    contentType = await contentTypeService.findOne({ name: 'Product' })!;
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findPage', () => {
    it('should return all contentTypes', async () => {
      const pageQuery = getPageQuery<ContentType>({ sort: ['_id', 'asc'] });
      jest.spyOn(contentTypeService, 'find');
      const result = await contentTypeController.findPage(pageQuery, {});
      expect(contentTypeService.find).toHaveBeenCalledWith({}, pageQuery);
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
            type: FieldType.text,
          },
          {
            name: 'image',
            label: 'Image',
            type: FieldType.file,
          },
          {
            name: 'description',
            label: 'Description',
            type: FieldType.html,
          },
          {
            name: 'rooms',
            label: 'Rooms',
            type: FieldType.file,
          },
          {
            name: 'price',
            label: 'Price',
            type: FieldType.file,
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
      const result = await contentTypeController.findOne(contentType!.id);
      expect(contentTypeService.findOne).toHaveBeenCalledWith(contentType!.id);
      expect(result).toEqualPayload(
        contentTypeFixtures.find(({ name }) => name === 'Product')!,
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
        contentType!.id,
      );
      expect(contentTypeService.updateOne).toHaveBeenCalledWith(
        contentType!.id,
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
      ).rejects.toThrow(getUpdateOneError(ContentType.name, NOT_FOUND_ID));
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
      const result = await contentTypeController.deleteOne(contentType!.id);
      expect(contentTypeService.deleteCascadeOne).toHaveBeenCalledWith(
        contentType!.id,
      );
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });

      await expect(
        contentTypeController.findOne(contentType!.id),
      ).rejects.toThrow(NotFoundException);

      expect(await contentService.find({ entity: contentType!.id })).toEqual(
        [],
      );
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
