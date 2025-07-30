/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
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
