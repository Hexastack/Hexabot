/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { LoggerService } from '@/logger/logger.service';
import {
  installMenuFixtures,
  offerMenuFixture,
  offersMenuFixtures,
  websiteMenuFixture,
} from '@/utils/test/fixtures/menu';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { MenuController } from './menu.controller';
import { MenuRepository } from '../repositories/menu.repository';
import { MenuModel } from '../schemas/menu.schema';
import { MenuType } from '../schemas/types/menu';
import { MenuService } from '../services/menu.service';
import { verifyTree } from '../utilities/verifyTree';

describe('MenuController', () => {
  let menuController: MenuController;
  let menuService: MenuService;
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installMenuFixtures),
        MongooseModule.forFeature([MenuModel]),
      ],
      providers: [
        MenuRepository,
        MenuService,
        EventEmitter2,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        LoggerService,
      ],
      controllers: [MenuController],
    }).compile();
    menuController = module.get<MenuController>(MenuController);
    menuService = module.get<MenuService>(MenuService);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);
  describe('create', () => {
    it('should create the item successfully', async () => {
      const initialData = {
        title: 'new Item',
        type: MenuType.postback,
        payload: 'string',
      };
      const result = await menuController.create(initialData);
      expect(result).toEqualPayload(initialData);
    });
  });
  describe('findOne', () => {
    it('should find an element by id', async () => {
      const websiteMenu = await menuService.findOne({
        title: websiteMenuFixture.title,
      });
      const search = await menuController.findOne(websiteMenu.id);
      expect(search).toEqualPayload(websiteMenuFixture);
    });
  });

  describe('getTree', () => {
    it('should return a valid tree', async () => {
      const tree = await menuController.getTree();
      expect(verifyTree(tree)).toBeTruthy();
    });
  });

  describe('delete', () => {
    it('should delete the subtree', async () => {
      const offersEntry = await menuService.findOne({
        title: offerMenuFixture.title,
      });
      await menuController.delete(offersEntry.id);

      const offersChildren = await menuService.find({
        title: {
          $in: [
            offersEntry.title,
            ...offersMenuFixtures.map((menu) => menu.title),
          ],
        },
      });

      expect(offersChildren.length).toBe(0);
    });
  });
});
