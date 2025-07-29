/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { OutgoingMessageFormat } from '@/chat/schemas/types/message';
import { ContentOptions } from '@/chat/schemas/types/options';
import { I18nService } from '@/i18n/services/i18n.service';
import { IGNORED_TEST_FIELDS } from '@/utils/test/constants';
import {
  contentFixtures,
  installContentFixtures,
} from '@/utils/test/fixtures/content';
import { getPageQuery } from '@/utils/test/pagination';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentRepository } from '../repositories/content.repository';
import { Content } from '../schemas/content.schema';

import { ContentTypeService } from './content-type.service';
import { ContentService } from './content.service';

describe('ContentService', () => {
  let contentService: ContentService;
  let contentTypeService: ContentTypeService;
  let contentRepository: ContentRepository;

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
    [contentService, contentTypeService, contentRepository] = await getMocks([
      ContentService,
      ContentTypeService,
      ContentRepository,
    ]);
  });

  afterAll(closeInMongodConnection);

  afterEach(jest.clearAllMocks);

  describe('findOneAndPopulate', () => {
    it('should return a content and populate its corresponding content type', async () => {
      const findSpy = jest.spyOn(contentRepository, 'findOneAndPopulate');
      const content = await contentService.findOne({ title: 'Jean' });

      const contentType = await contentTypeService.findOne(content!.entity);
      const result = await contentService.findOneAndPopulate(content!.id);
      expect(findSpy).toHaveBeenCalledWith(content!.id, undefined);
      expect(result).toEqualPayload({
        ...contentFixtures.find(({ title }) => title === 'Jean'),
        entity: contentType,
      });
    });
  });

  describe('find', () => {
    const pageQuery = getPageQuery<Content>({ limit: 1, sort: ['_id', 'asc'] });
    it('should return contents and populate their corresponding content types', async () => {
      const findSpy = jest.spyOn(contentRepository, 'findAndPopulate');
      const results = await contentService.findAndPopulate({}, pageQuery);
      const contentType = await contentTypeService.findOne(
        results[0].entity.id,
      );
      expect(findSpy).toHaveBeenCalledWith({}, pageQuery, undefined);
      expect(results).toEqualPayload([
        {
          ...contentFixtures.find(({ title }) => title === 'Jean'),
          entity: contentType,
        },
      ]);
    });
  });

  describe('getContent', () => {
    const contentOptions: ContentOptions = {
      display: OutgoingMessageFormat.list,
      fields: {
        title: 'title',
        subtitle: 'description',
        image_url: 'image',
      },
      buttons: [],
      limit: 10,
    };

    it('should get content that is published', async () => {
      const actualData = await contentService.find(
        { status: true },
        { skip: 0, limit: 10, sort: ['createdAt', 'desc'] },
      );
      const flattenedElements = actualData.map(Content.toElement);
      const content = await contentService.getContent(contentOptions, 0);
      expect(content?.elements).toEqualPayload(flattenedElements, [
        ...IGNORED_TEST_FIELDS,
        'payload',
      ]);
    });

    it('should get content for a specific entity', async () => {
      const contentType = await contentTypeService.findOne({ name: 'Product' });
      const actualData = await contentService.find(
        { status: true, entity: contentType!.id },
        { skip: 0, limit: 10, sort: ['createdAt', 'desc'] },
      );
      const flattenedElements = actualData.map(Content.toElement);
      const content = await contentService.getContent(
        {
          ...contentOptions,
          entity: contentType!.id,
        },
        0,
      );
      expect(content?.elements).toEqualPayload(flattenedElements);
    });

    it('should get content using query', async () => {
      const contentType = await contentTypeService.findOne({ name: 'Product' });
      const actualData = await contentService.find(
        { status: true, entity: contentType!.id, title: /^Jean/ },
        { skip: 0, limit: 10, sort: ['createdAt', 'desc'] },
      );
      const flattenedElements = actualData.map(Content.toElement);
      const content = await contentService.getContent(
        {
          ...contentOptions,
          query: { title: /^Jean/ },
        },
        0,
      );
      expect(content?.elements).toEqualPayload(flattenedElements);
    });

    it('should get content skiping 2 elements', async () => {
      const actualData = await contentService.find(
        { status: true },
        { skip: 2, limit: 2, sort: ['createdAt', 'desc'] },
      );
      const flattenedElements = actualData.map(Content.toElement);
      const content = await contentService.getContent(
        {
          ...contentOptions,
          query: {},
          entity: undefined,
          limit: 2,
        },
        2,
      );
      expect(content?.elements).toEqualPayload(flattenedElements, [
        ...IGNORED_TEST_FIELDS,
        'payload',
      ]);
    });
  });
});
