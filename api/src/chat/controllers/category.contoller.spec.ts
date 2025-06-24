/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { I18nService } from '@/i18n/services/i18n.service';
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
import { buildTestingMocks } from '@/utils/test/utils';

import { CategoryCreateDto, CategoryUpdateDto } from '../dto/category.dto';
import { CategoryService } from '../services/category.service';

import { Category } from './../schemas/category.schema';
import { CategoryController } from './category.controller';

describe('CategoryController', () => {
  let categoryController: CategoryController;
  let categoryService: CategoryService;
  let category: Category;
  let categoryToDelete: Category;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [CategoryController],
      imports: [rootMongooseTestModule(installCategoryFixtures)],
      providers: [
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [categoryService, categoryController] = await getMocks([
      CategoryService,
      CategoryController,
    ]);
    category = (await categoryService.findOne({
      label: 'test category 1',
    })) as Category;
    categoryToDelete = (await categoryService.findOne({
      label: 'test category 2',
    })) as Category;
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
      const category = (await categoryService.findOne({
        label: 'test category 1',
      })) as Category;
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

  describe('deleteMany', () => {
    it('should delete multiple categories by ids', async () => {
      const deleteResult = { acknowledged: true, deletedCount: 2 };
      jest.spyOn(categoryService, 'deleteMany').mockResolvedValue(deleteResult);

      const result = await categoryController.deleteMany([
        category.id,
        categoryToDelete.id,
      ]);

      expect(categoryService.deleteMany).toHaveBeenCalledWith({
        _id: { $in: [category.id, categoryToDelete.id] },
      });
      expect(result).toEqual(deleteResult);
    });

    it('should throw a NotFoundException when no categories are deleted', async () => {
      const deleteResult = { acknowledged: true, deletedCount: 0 };
      jest.spyOn(categoryService, 'deleteMany').mockResolvedValue(deleteResult);

      await expect(
        categoryController.deleteMany([category.id, categoryToDelete.id]),
      ).rejects.toThrow(
        new NotFoundException('Categories with provided IDs not found'),
      );

      expect(categoryService.deleteMany).toHaveBeenCalledWith({
        _id: { $in: [category.id, categoryToDelete.id] },
      });
    });

    it('should throw a BadRequestException when no ids are provided', async () => {
      await expect(categoryController.deleteMany([])).rejects.toThrow(
        new BadRequestException('No IDs provided for deletion.'),
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
