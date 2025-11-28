/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { In } from 'typeorm';

import {
  categoryFixtures,
  installCategoryFixturesTypeOrm,
} from '@/utils/test/fixtures/category';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import {
  Category,
  CategoryCreateDto,
  CategoryUpdateDto,
} from '../dto/category.dto';
import { CategoryService } from '../services/category.service';

import { CategoryController } from './category.controller';

describe('CategoryController (TypeORM)', () => {
  let module: TestingModule;
  let categoryController: CategoryController;
  let categoryService: CategoryService;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [CategoryController],
      typeorm: {
        fixtures: installCategoryFixturesTypeOrm,
      },
    });

    module = testing.module;

    [categoryController, categoryService] = await testing.getMocks([
      CategoryController,
      CategoryService,
    ]);
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('filterCount', () => {
    it('should count categories', async () => {
      const expectedCount = await categoryService.count({});
      const countSpy = jest.spyOn(categoryService, 'count');
      const result = await categoryController.filterCount();

      expect(countSpy).toHaveBeenCalledWith({});
      expect(result).toEqual({ count: expectedCount });
    });
  });

  describe('findPage', () => {
    it('should find categories', async () => {
      const expected = await categoryService.find({});
      const findSpy = jest.spyOn(categoryService, 'find');
      const result = await categoryController.findPage({});

      expect(findSpy).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(expected);
    });
  });

  describe('findOne', () => {
    it('should return the existing category', async () => {
      const target = await categoryService.findOne({
        where: { label: categoryFixtures[0].label },
      });
      expect(target).toBeDefined();

      const findOneSpy = jest.spyOn(categoryService, 'findOne');
      const result = await categoryController.findOne(target!.id);

      expect(findOneSpy).toHaveBeenCalledWith(target!.id);
      expect(result).toEqualPayload(categoryFixtures[0]);
    });

    it('should throw a NotFoundException when category does not exist', async () => {
      const id = randomUUID();
      const findOneSpy = jest
        .spyOn(categoryService, 'findOne')
        .mockResolvedValueOnce(null);

      await expect(categoryController.findOne(id)).rejects.toThrow(
        new NotFoundException(`Category with ID ${id} not found`),
      );
      expect(findOneSpy).toHaveBeenCalledWith(id);
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const payload: CategoryCreateDto = {
        label: `category-${Math.random().toString(36).slice(2, 10)}`,
        builtin: false,
        zoom: 150,
        offset: [10, 20],
      };
      const createSpy = jest.spyOn(categoryService, 'create');
      const result = await categoryController.create(payload);

      expect(createSpy).toHaveBeenCalledWith(payload);
      expect(result).toEqualPayload(payload);

      await categoryService.deleteOne(result.id);
    });
  });

  describe('updateOne', () => {
    it('should update an existing category', async () => {
      const created = await categoryService.create({
        label: `category-${Math.random().toString(36).slice(2, 10)}`,
        builtin: false,
      });
      const updates: CategoryUpdateDto = {
        zoom: 80,
        offset: [5, 5],
      };
      const updateSpy = jest.spyOn(categoryService, 'updateOne');
      const result = await categoryController.updateOne(created.id, updates);

      expect(updateSpy).toHaveBeenCalledWith(created.id, updates);
      expect(result.id).toBe(created.id);
      expect(result.zoom).toBe(updates.zoom);
      expect(result.offset).toEqual(updates.offset);

      await categoryService.deleteOne(result.id);
    });
  });

  describe('deleteOne', () => {
    it('should delete a category by id', async () => {
      const deletable = await categoryService.create({
        label: `category-${Math.random().toString(36).slice(2, 10)}`,
        builtin: false,
      });
      const deleteSpy = jest.spyOn(categoryService, 'deleteOne');
      const result = await categoryController.deleteOne(deletable.id);

      expect(deleteSpy).toHaveBeenCalledWith(deletable.id);
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });

      const lookup = await categoryService.findOne(deletable.id);
      expect(lookup).toBeNull();
    });

    it('should throw a NotFoundException when deletion result is empty', async () => {
      const id = randomUUID();
      const deleteSpy = jest
        .spyOn(categoryService, 'deleteOne')
        .mockResolvedValueOnce({ acknowledged: true, deletedCount: 0 });

      await expect(categoryController.deleteOne(id)).rejects.toThrow(
        new NotFoundException(`Category with ID ${id} not found`),
      );
      expect(deleteSpy).toHaveBeenCalledWith(id);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple categories by ids', async () => {
      const createdCategories: Category[] = await categoryService.createMany([
        { label: `category-${Math.random().toString(36).slice(2, 10)}` },
        { label: `category-${Math.random().toString(36).slice(2, 10)}` },
      ]);
      const ids = createdCategories.map(({ id }) => id);
      const result = await categoryController.deleteMany(ids);

      expect(result).toEqualPayload({
        acknowledged: true,
        deletedCount: ids.length,
      });

      const remaining = await categoryService.find({
        where: { id: In(ids) },
      });
      expect(remaining).toHaveLength(0);
    });

    it('should throw a NotFoundException when provided IDs do not exist', async () => {
      const ids = [randomUUID(), randomUUID()];

      await expect(categoryController.deleteMany(ids)).rejects.toThrow(
        new NotFoundException('Categories with provided IDs not found'),
      );
    });

    it('should throw a BadRequestException when no ids are provided', async () => {
      await expect(categoryController.deleteMany([])).rejects.toThrow(
        new BadRequestException('No IDs provided for deletion.'),
      );
    });
  });
});
