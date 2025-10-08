/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { LabelGroupRepository } from './label-group.repository';
import { LabelRepository } from './label.repository';

describe('LabelRepository', () => {
  let labelRepository: LabelRepository;
  let labelGroupRepository: LabelGroupRepository;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(() => Promise.resolve())],
      providers: [LabelRepository, LabelGroupRepository],
    });
    [labelRepository, labelGroupRepository] = await getMocks([
      LabelRepository,
      LabelGroupRepository,
    ]);
  });

  afterEach(jest.clearAllMocks);
  afterAll(closeInMongodConnection);

  describe('deleteOne', () => {
    it('should reset labels to null when their group is deleted', async () => {
      const newGroup = await labelGroupRepository.create({
        name: 'Group To Be Deleted',
      });

      await labelRepository.create({
        title: 'Orphan Label',
        name: 'ORPHAN_LABEL',
        group: newGroup.id,
      });

      await labelGroupRepository.deleteOne(newGroup.id);

      const orphanLabel = await labelRepository.findOne({
        name: 'ORPHAN_LABEL',
      });

      expect(orphanLabel?.group).toBe(null);
    });
  });
});
