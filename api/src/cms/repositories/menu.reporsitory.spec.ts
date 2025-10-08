/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import {
  installMenuFixtures,
  rootMenuFixtures,
} from '@/utils/test/fixtures/menu';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { MenuType } from '../schemas/types/menu';

import { MenuRepository } from './menu.repository';

describe('MenuRepository', () => {
  let menuRepository: MenuRepository;
  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installMenuFixtures)],
      providers: [MenuRepository],
    });
    [menuRepository] = await getMocks([MenuRepository]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a populated version of the document', async () => {
      const parent = await menuRepository.create({
        title: 'Test1',
        type: MenuType.nested,
      });
      const child = await menuRepository.create({
        ...rootMenuFixtures[0],
        parent: parent.id,
      });
      const result = await menuRepository.findOneAndPopulate(child.id);
      expect(result).toEqual({ ...child, parent });
    });
  });
});
