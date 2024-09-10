/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { ContentRepository } from '@/cms/repositories/content.repository';
import { ContentModel } from '@/cms/schemas/content.schema';
import { ContentService } from '@/cms/services/content.service';
import { ExtendedI18nService } from '@/extended-i18n.service';
import { LoggerService } from '@/logger/logger.service';
import { PluginService } from '@/plugins/plugins.service';
import { SettingService } from '@/setting/services/setting.service';
import {
  categoryFixtures,
  installCategoryFixtures,
} from '@/utils/test/fixtures/category';
import { getPageQuery } from '@/utils/test/pagination';
import { sortRowsBy } from '@/utils/test/sort';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { Category, CategoryModel } from './../schemas/category.schema';
import { CategoryController } from './category.controller';
import { CategoryCreateDto, CategoryUpdateDto } from '../dto/category.dto';
import { BlockRepository } from '../repositories/block.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { BlockModel } from '../schemas/block.schema';
import { LabelModel } from '../schemas/label.schema';
import { BlockService } from '../services/block.service';
import { CategoryService } from '../services/category.service';

describe('CategoryController', () => {
  let categoryController: CategoryController;
  let categoryService: CategoryService;
  let category: Category;
  let categoryToDelete: Category;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [CategoryController],
      imports: [
        rootMongooseTestModule(installCategoryFixtures),
        MongooseModule.forFeature([
          BlockModel,
          LabelModel,
          CategoryModel,
          ContentModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        BlockRepository,
        CategoryRepository,
        ContentRepository,
        AttachmentRepository,
        BlockService,
        CategoryService,
        ContentService,
        AttachmentService,
        {
          provide: PluginService,
          useValue: {},
        },
        LoggerService,
        {
          provide: ExtendedI18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
        {
          provide: SettingService,
          useValue: {
            getConfig: jest.fn(() => ({
              chatbot: { lang: { default: 'fr' } },
            })),
            getSettings: jest.fn(() => ({})),
          },
        },
        {
          provide: BlockService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        EventEmitter2,
      ],
    }).compile();
    categoryService = module.get<CategoryService>(CategoryService);
    categoryController = module.get<CategoryController>(CategoryController);
    category = await categoryService.findOne({ label: 'test category 1' });
    categoryToDelete = await categoryService.findOne({
      label: 'test category 2',
    });
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('findPage', () => {
    it('should return an array of categories', async () => {
      const pageQuery = getPageQuery<Category>();
      const result = await categoryController.findPage(pageQuery, {});

      expect(result).toEqualPayload(categoryFixtures.sort(sortRowsBy));
    });
  });

  describe('count', () => {
    it('should count categories', async () => {
      jest.spyOn(categoryService, 'count');
      const result = await categoryController.filterCount();

      expect(categoryService.count).toHaveBeenCalled();
      expect(result).toEqual({ count: categoryFixtures.length });
    });
  });

  describe('findOne', () => {
    it('should return the existing category', async () => {
      jest.spyOn(categoryService, 'findOne');
      const category = await categoryService.findOne({
        label: 'test category 1',
      });
      const result = await categoryController.findOne(category.id);

      expect(categoryService.findOne).toHaveBeenCalledWith(category.id);
      expect(result).toEqualPayload({
        ...categoryFixtures.find(({ label }) => label === 'test category 1'),
      });
    });
  });

  describe('create', () => {
    it('should return created category', async () => {
      jest.spyOn(categoryService, 'create');
      const categoryCreateDto: CategoryCreateDto = {
        label: 'categoryLabel2',
        builtin: true,
        zoom: 100,
        offset: [0, 0],
      };
      const result = await categoryController.create(categoryCreateDto);

      expect(categoryService.create).toHaveBeenCalledWith(categoryCreateDto);
      expect(result).toEqualPayload(categoryCreateDto);
    });
  });

  describe('deleteOne', () => {
    it('should delete a category by id', async () => {
      jest.spyOn(categoryService, 'deleteOne');
      const result = await categoryController.deleteOne(categoryToDelete.id);
      expect(categoryService.deleteOne).toHaveBeenCalledWith(
        categoryToDelete.id,
      );
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });

    it('should throw a NotFoundException when attempting to delete a category by id', async () => {
      jest.spyOn(categoryService, 'deleteOne');

      const result = categoryController.deleteOne(categoryToDelete.id);
      expect(categoryService.deleteOne).toHaveBeenCalledWith(
        categoryToDelete.id,
      );
      await expect(result).rejects.toThrow(
        new NotFoundException(
          `Category with ID ${categoryToDelete.id} not found`,
        ),
      );
    });
  });

  describe('updateOne', () => {
    const categoryUpdateDto: CategoryUpdateDto = {
      builtin: false,
    };
    it('should return updated category', async () => {
      jest.spyOn(categoryService, 'updateOne');
      const result = await categoryController.updateOne(
        category.id,
        categoryUpdateDto,
      );

      expect(categoryService.updateOne).toHaveBeenCalledWith(
        category.id,
        categoryUpdateDto,
      );
      expect(result).toEqualPayload({
        ...categoryFixtures.find(({ label }) => label === 'test category 1'),
        ...categoryUpdateDto,
      });
    });
  });
});
