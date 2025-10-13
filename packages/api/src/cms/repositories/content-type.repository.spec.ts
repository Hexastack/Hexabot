/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BlockService } from '@/chat/services/block.service';
import { ContentType } from '@/cms/schemas/content-type.schema';
import { I18nService } from '@/i18n/services/i18n.service';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { Content } from '../schemas/content.schema';

import { installContentFixtures } from './../../utils/test/fixtures/content';
import { ContentTypeRepository } from './content-type.repository';

describe('ContentTypeRepository', () => {
  let contentTypeRepository: ContentTypeRepository;
  let contentTypeModel: Model<ContentType>;
  let contentModel: Model<Content>;
  let blockService: BlockService;

  beforeAll(async () => {
    const { getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      imports: [rootMongooseTestModule(installContentFixtures)],
      providers: [
        ContentTypeRepository,
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((t) => t),
          },
        },
      ],
    });
    [blockService, contentTypeRepository, contentTypeModel, contentModel] =
      await getMocks([
        BlockService,
        ContentTypeRepository,
        getModelToken(ContentType.name),
        getModelToken(Content.name),
      ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('deleteCascadeOne', () => {
    it('should delete a contentType by id if no associated block was found', async () => {
      jest.spyOn(blockService, 'findOne').mockResolvedValueOnce(null);
      const contentType = await contentTypeModel.findOne({ name: 'Store' });
      const result = await contentTypeRepository.deleteOne(contentType!.id);
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
      const contents = await contentModel.find({
        entity: contentType!.id,
      });
      expect(contents).toEqual([]);
    });
  });
});
