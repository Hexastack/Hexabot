/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { NotFoundException } from '@nestjs/common';

import {
  installMenuFixtures,
  rootMenuFixtures,
} from '@/utils/test/fixtures/menu';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { MenuRepository } from '../repositories/menu.repository';
import { MenuType } from '../schemas/types/menu';
import { verifyTree } from '../utilities/verifyTree';

import { MenuService } from './menu.service';

describe('MenuService', () => {
  let menuService: MenuService;
  let menuRepository: MenuRepository;
  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installMenuFixtures)],
      providers: [MenuService],
    });
    [menuService, menuRepository] = await getMocks([
      MenuService,
      MenuRepository,
    ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);
  describe('create', () => {
    it('should create the menu successfully', async () => {
      const testingItem = rootMenuFixtures[0];
      jest.spyOn(menuRepository, 'create');
      const result = await menuService.create(testingItem);
      expect(result).toEqualPayload(testingItem);
      expect(menuRepository.create).toHaveBeenCalled();
    });
    it('should throw a 404 error', async () => {
      const testingItem = rootMenuFixtures[0];
      testingItem.parent = '542c2b97bac0595474108b48';
      await expect(menuService.create(testingItem)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should throw validation errors', async () => {
      const testingItem = rootMenuFixtures[0];
      testingItem.type = MenuType.postback;
      testingItem.payload = undefined;
      await expect(menuService.create(testingItem)).rejects.toThrow();
      testingItem.type = MenuType.web_url;
      testingItem.url = undefined;
      await expect(menuService.create(testingItem)).rejects.toThrow();
    });
  });

  describe('getTree', () => {
    it('should create a valid menu tree', async () => {
      const result = await menuService.getTree();
      expect(verifyTree(result)).toBeTruthy();
    });
  });
});
