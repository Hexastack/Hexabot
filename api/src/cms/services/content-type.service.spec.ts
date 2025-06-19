/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { BlockService } from '@/chat/services/block.service';
import { I18nService } from '@/i18n/services/i18n.service';
import { installContentFixtures } from '@/utils/test/fixtures/content';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentTypeRepository } from '../repositories/content-type.repository';

import { ContentTypeService } from './content-type.service';
import { ContentService } from './content.service';

describe('ContentTypeService', () => {
  let contentTypeService: ContentTypeService;
  let contentService: ContentService;
  let contentTypeRepository: ContentTypeRepository;
  let blockService: BlockService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installContentFixtures)],
      providers: [
        ContentTypeService,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [blockService, contentTypeService, contentService, contentTypeRepository] =
      await getMocks([
        BlockService,
        ContentTypeService,
        ContentService,
        ContentTypeRepository,
      ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('deleteOne', () => {
    it('should delete a content type and its related contents', async () => {
      const deleteContentTypeSpy = jest.spyOn(
        contentTypeRepository,
        'deleteOne',
      );
      jest.spyOn(blockService, 'findOne').mockResolvedValueOnce(null);
      const contentType = await contentTypeService.findOne({ name: 'Product' });

      const result = await contentTypeService.deleteCascadeOne(contentType!.id);
      expect(deleteContentTypeSpy).toHaveBeenCalledWith(contentType!.id);
      expect(await contentService.find({ entity: contentType!.id })).toEqual(
        [],
      );
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });
  });
});
