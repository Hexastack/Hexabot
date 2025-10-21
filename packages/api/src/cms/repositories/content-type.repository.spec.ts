/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { ForbiddenException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

import { BlockRepository } from '@/chat/repositories/block.repository';
import { BlockService } from '@/chat/services/block.service';
import { ContentTypeOrmEntity } from '@/cms/entities/content-type.entity';
import { ContentOrmEntity } from '@/cms/entities/content.entity';
import { FieldType } from '@/setting/types';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentTypeRepository } from './content-type.repository';
import { ContentRepository } from './content.repository';

describe('ContentTypeRepository (TypeORM)', () => {
  let module: TestingModule;
  let repository: ContentTypeRepository;
  let contentRepository: ContentRepository;
  const blockServiceMock = {
    findOne: jest.fn(),
  };

  const buildRequiredFields = () => [
    {
      name: 'title' as const,
      label: 'Title',
      type: FieldType.text as const,
    },
    {
      name: 'status' as const,
      label: 'Status',
      type: FieldType.checkbox as const,
    },
  ];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      providers: [
        ContentRepository,
        ContentTypeRepository,
        {
          provide: BlockRepository,
          useValue: {},
        },
        {
          provide: BlockService,
          useValue: blockServiceMock,
        },
      ],
      typeorm: {
        entities: [ContentTypeOrmEntity, ContentOrmEntity],
      },
    });

    module = testing.module;
    [repository, contentRepository] = await testing.getMocks([
      ContentTypeRepository,
      ContentRepository,
    ]);
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('preDelete block association guard', () => {
    it('rejects deletion when a block is associated to the content type', async () => {
      const created = await repository.create({
        name: `type-${randomUUID()}`,
        fields: buildRequiredFields(),
      });

      blockServiceMock.findOne.mockResolvedValueOnce({ id: 'block-1' });

      await expect(repository.deleteOne(created.id)).rejects.toThrow(
        ForbiddenException,
      );

      expect(blockServiceMock.findOne).toHaveBeenCalledWith({
        'options.content.entity': created.id,
      });
      const contentType = await repository.findOne({
        where: { id: created.id },
      });
      expect(contentType).not.toBeNull();
    });
  });

  describe('deleteOne cascade', () => {
    it('removes related contents when deleting a content type', async () => {
      blockServiceMock.findOne.mockResolvedValue(null);

      const created = await repository.create({
        name: `cascade-${randomUUID()}`,
        fields: buildRequiredFields(),
      });

      await contentRepository.create({
        title: 'related-content-a',
        contentTypeId: created.id,
        status: true,
        dynamicFields: {},
      });
      await contentRepository.create({
        title: 'related-content-b',
        contentTypeId: created.id,
        status: true,
        dynamicFields: {},
      });

      const result = await repository.deleteOne(created.id);

      expect(result.deletedCount).toBe(1);
      expect(blockServiceMock.findOne).toHaveBeenCalledWith({
        'options.content.entity': created.id,
      });

      const remainingContents = await contentRepository.find({
        where: { contentType: { id: created.id } },
      });
      expect(remainingContents).toHaveLength(0);

      const deletedType = await repository.findOne({
        where: { id: created.id },
      });
      expect(deletedType).toBeNull();
    });
  });
});
