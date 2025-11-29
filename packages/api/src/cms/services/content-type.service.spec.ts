/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { TestingModule } from '@nestjs/testing';

import { BlockService } from '@/chat/services/block.service';
import { FieldType } from '@/setting/types';
import {
  contentTypeOrmFixtures,
  installContentTypeFixturesTypeOrm,
} from '@/utils/test/fixtures/contenttype';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentField } from '../dto/contentType.dto';

import { ContentTypeService } from './content-type.service';

describe('ContentTypeService (TypeORM)', () => {
  let module: TestingModule;
  let service: ContentTypeService;
  const createdIds: string[] = [];
  const blockServiceMock = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        ContentTypeService,
        {
          provide: BlockService,
          useFactory: () => blockServiceMock,
        },
      ],
      typeorm: {
        fixtures: installContentTypeFixturesTypeOrm,
      },
    });
    module = testingModule;
    [service] = await getMocks([ContentTypeService]);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (createdIds.length > 0) {
      await Promise.all(
        createdIds.map(async (id) => {
          await service.deleteOne(id);
        }),
      );
      createdIds.length = 0;
    }
  });

  describe('create', () => {
    it('applies default fields when none are provided', async () => {
      const payload = { name: 'Blog posts' };
      const created = await service.create(payload);
      createdIds.push(created.id);

      expect(created).toMatchObject({
        id: expect.any(String),
        name: payload.name,
      });
      expect(created.fields).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'title',
            type: FieldType.text,
          }),
          expect.objectContaining({
            name: 'status',
            type: FieldType.checkbox,
          }),
        ]),
      );
    });
  });

  describe('deleteCascadeOne', () => {
    it('removes the requested content type', async () => {
      const baseName = `${contentTypeOrmFixtures[0].name}-to-delete`;
      const baseFields =
        (contentTypeOrmFixtures[0].fields as ContentField[] | undefined)?.map(
          (field) => ({ ...field }),
        ) ?? [];
      const created = await service.create({
        name: baseName,
        fields: baseFields,
      });
      createdIds.push(created.id);

      const deleted = await service.deleteOne(created.id);
      createdIds.splice(createdIds.indexOf(created.id), 1);
      const found = await service.findOne(created.id);

      expect(deleted).toEqual({ acknowledged: true, deletedCount: 1 });
      expect(found).toBeNull();
    });
  });
});
