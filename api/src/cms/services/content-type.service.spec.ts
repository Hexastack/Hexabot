/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import { AttachmentRepository } from '@/attachment/repositories/attachment.repository';
import { AttachmentModel } from '@/attachment/schemas/attachment.schema';
import { AttachmentService } from '@/attachment/services/attachment.service';
import { BlockService } from '@/chat/services/block.service';
import { LoggerService } from '@/logger/logger.service';
import { installContentFixtures } from '@/utils/test/fixtures/content';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { ContentTypeRepository } from '../repositories/content-type.repository';
import { ContentRepository } from '../repositories/content.repository';
import { ContentTypeModel } from '../schemas/content-type.schema';
import { ContentModel } from '../schemas/content.schema';

import { ContentTypeService } from './content-type.service';
import { ContentService } from './content.service';

describe('ContentTypeService', () => {
  let contentTypeService: ContentTypeService;
  let contentService: ContentService;
  let contentTypeRepository: ContentTypeRepository;
  let blockService: BlockService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installContentFixtures),
        MongooseModule.forFeature([
          ContentTypeModel,
          ContentModel,
          AttachmentModel,
        ]),
      ],
      providers: [
        ContentTypeRepository,
        ContentRepository,
        AttachmentRepository,
        ContentTypeService,
        ContentService,
        AttachmentService,
        LoggerService,
        EventEmitter2,
        {
          provide: BlockService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();
    blockService = module.get<BlockService>(BlockService);
    contentTypeService = module.get<ContentTypeService>(ContentTypeService);
    contentService = module.get<ContentService>(ContentService);
    contentTypeRepository = module.get<ContentTypeRepository>(
      ContentTypeRepository,
    );
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('deleteOne', () => {
    it('should delete a content type and its related contents', async () => {
      const deleteContentTypeSpy = jest.spyOn(
        contentTypeRepository,
        'deleteOne',
      );
      jest.spyOn(blockService, 'findOne').mockResolvedValueOnce(null);
      const contentType = await contentTypeService.findOne({ name: 'Product' });
      const result = await contentTypeService.deleteCascadeOne(contentType.id);
      expect(deleteContentTypeSpy).toHaveBeenCalledWith(contentType.id);
      expect(await contentService.find({ entity: contentType.id })).toEqual([]);
      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
    });
  });
});
