/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';

import {
  ContentType,
  ContentTypeModel,
} from '@/cms/schemas/content-type.schema';
import { LoggerService } from '@/logger/logger.service';
import { contentTypeFixtures } from '@/utils/test/fixtures/contenttype';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';

import { Content, ContentModel } from '../schemas/content.schema';

import {
  contentFixtures,
  installContentFixtures,
} from './../../utils/test/fixtures/content';
import { ContentRepository } from './content.repository';

describe('ContentRepository', () => {
  let contentRepository: ContentRepository;
  let contentModel: Model<Content>;
  let contentTypeModel: Model<ContentType>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(installContentFixtures),
        MongooseModule.forFeature([ContentTypeModel, ContentModel]),
      ],
      providers: [LoggerService, ContentRepository, EventEmitter2],
    }).compile();
    contentRepository = module.get<ContentRepository>(ContentRepository);
    contentModel = module.get<Model<Content>>(getModelToken('Content'));
    contentTypeModel = module.get<Model<ContentType>>(
      getModelToken('ContentType'),
    );
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should find a content and populate its content type', async () => {
      const findSpy = jest.spyOn(contentModel, 'findById');
      const content = await contentModel.findOne({ title: 'Jean' });
      const contentType = await contentTypeModel.findById(content.entity);
      const result = await contentRepository.findOneAndPopulate(content.id);
      expect(findSpy).toHaveBeenCalledWith(content.id, undefined);
      expect(result).toEqualPayload({
        ...contentFixtures.find(({ title }) => title === 'Jean'),
        entity: contentTypeFixtures.find(
          ({ name }) => name === contentType.name,
        ),
      });
    });
  });

  describe('findPageAndPopulate', () => {
    it('should find contents and populate their content types', async () => {
      const pageQuery = getPageQuery<Content>({
        limit: 1,
        sort: ['_id', 'asc'],
      });
      const result = await contentRepository.findPageAndPopulate({}, pageQuery);
      expect(result).toEqualPayload([
        {
          ...contentFixtures.find(({ title }) => title === 'Jean'),
          entity: contentTypeFixtures[0],
        },
      ]);
    });
  });
});
