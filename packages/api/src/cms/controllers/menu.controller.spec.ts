/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { InternalServerErrorException, NotFoundException } from '@nestjs/common';

import { LoggerService } from '@/logger/logger.service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { MenuCreateDto } from '../dto/menu.dto';
import { Menu } from '../entities/menu.entity';
import { MenuService } from '../services/menu.service';
import { MenuType } from '../types/menu';

import { MenuController } from './menu.controller';

const createLoggerMock = (): jest.Mocked<LoggerService> =>
  ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
    fatal: jest.fn(),
  }) as unknown as jest.Mocked<LoggerService>;

const createMenu = (overrides: Partial<Menu> = {}) =>
  Object.assign(new Menu(), {
    id: 'menu-1',
    title: 'Root',
    type: MenuType.nested,
    parent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

describe('MenuController', () => {
  let controller: MenuController;
  let service: jest.Mocked<MenuService>;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    service = {
      count: jest.fn(),
      find: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      updateOne: jest.fn(),
      deepDelete: jest.fn(),
      getTree: jest.fn(),
    } as unknown as jest.Mocked<MenuService>;

    logger = createLoggerMock();
    controller = new MenuController(service, logger);
  });

  describe('filterCount', () => {
    it('returns service count result', async () => {
      service.count.mockResolvedValue(5);

      const result = await controller.filterCount({});

      expect(service.count).toHaveBeenCalledWith({});
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('find', () => {
    const pageQuery: PageQueryDto<Menu> = { limit: 10, skip: 0 };

    it('uses pagination when provided', async () => {
      const menus = [createMenu()];
      service.find.mockResolvedValue(menus);

      const result = await controller.find(pageQuery, {}, undefined);

      expect(service.find).toHaveBeenCalledWith({}, pageQuery);
      expect(result).toEqual(menus);
    });

    it('returns all when neither pagination nor filters are provided', async () => {
      const menus = [createMenu()];
      service.findAll.mockResolvedValue(menus);

      const result = await controller.find({ limit: undefined, skip: undefined }, {}, undefined);

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(menus);
    });

    it('applies raw query when provided', async () => {
      const menus = [createMenu()];
      service.find.mockResolvedValue(menus);

      const result = await controller.find(
        { limit: undefined, skip: undefined },
        {},
        { parent: 'menu-1' },
      );

      expect(service.find).toHaveBeenCalledWith({ parent: 'menu-1' });
      expect(result).toEqual(menus);
    });
  });

  describe('create', () => {
    it('delegates to service', async () => {
      const payload: MenuCreateDto = {
        title: 'Postback',
        type: MenuType.postback,
        payload: 'payload',
      };
      const menu = createMenu(payload);
      service.create.mockResolvedValue(menu);

      const result = await controller.create(payload);

      expect(service.create).toHaveBeenCalledWith(payload);
      expect(result).toBe(menu);
    });
  });

  describe('findOne', () => {
    it('returns menu when found', async () => {
      const menu = createMenu();
      service.findOne.mockResolvedValue(menu);

      const result = await controller.findOne(menu.id);

      expect(result).toBe(menu);
    });

    it('wraps missing entity as InternalServerErrorException', async () => {
      service.findOne.mockResolvedValue(null);

      await expect(controller.findOne('missing')).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it('wraps unexpected errors as InternalServerError', async () => {
      service.findOne.mockRejectedValue(new Error('boom'));

      await expect(controller.findOne('id')).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('getTree', () => {
    it('returns tree from service', async () => {
      const tree = [{ id: 'root', title: 'Root', type: MenuType.nested }];
      service.getTree.mockResolvedValue(tree as any);

      const result = await controller.getTree();

      expect(result).toBe(tree);
    });
  });

  describe('updateOne', () => {
    it('creates when id is empty', async () => {
      const payload: MenuCreateDto = {
        title: 'Quick',
        type: MenuType.postback,
        payload: 'payload',
      };

      const menu = createMenu(payload);
      service.create.mockResolvedValue(menu);

      const result = await controller.updateOne(payload, '');

      expect(service.create).toHaveBeenCalledWith(payload);
      expect(result).toBe(menu);
    });

    it('updates existing menu', async () => {
      const menu = createMenu({ title: 'Updated' });
      service.updateOne.mockResolvedValue(menu);

      const payload: MenuCreateDto = {
        title: 'Updated',
        type: MenuType.postback,
        payload: 'payload',
      };

      const result = await controller.updateOne(payload, menu.id);

      expect(service.updateOne).toHaveBeenCalledWith(menu.id, payload);
      expect(result).toBe(menu);
    });
  });

  describe('delete', () => {
    it('returns empty string when deletion succeeds', async () => {
      service.deepDelete.mockResolvedValue(2);

      const result = await controller.delete('menu-1');

      expect(service.deepDelete).toHaveBeenCalledWith('menu-1');
      expect(result).toBe('');
    });

    it('wraps not found deletion as InternalServerErrorException', async () => {
      service.deepDelete.mockResolvedValue(0);

      await expect(controller.delete('missing')).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalled();
    });

    it('wraps errors in InternalServerErrorException', async () => {
      service.deepDelete.mockRejectedValue(new Error('boom'));

      await expect(controller.delete('id')).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(logger.error).toHaveBeenCalled();
    });
  });
});
