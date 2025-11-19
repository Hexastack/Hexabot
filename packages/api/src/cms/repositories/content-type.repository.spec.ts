/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { ForbiddenException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';

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
  let dataSource: DataSource;

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
      providers: [ContentRepository, ContentTypeRepository],
      typeorm: {
        entities: [ContentTypeOrmEntity, ContentOrmEntity],
      },
    });

    module = testing.module;
    [repository, contentRepository] = await testing.getMocks([
      ContentTypeRepository,
      ContentRepository,
    ]);
    dataSource = module.get(DataSource);
    await dataSource.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        id varchar PRIMARY KEY,
        options text NOT NULL,
        message text NOT NULL
      )
    `);
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
      const blockId = `block-${randomUUID()}`;
      const options = {
        content: {
          display: 'list',
          fields: {
            title: 'Title',
            subtitle: null,
            image_url: null,
          },
          buttons: [],
          limit: 5,
          entity: created.id,
        },
      };
      await dataSource.query(
        `INSERT INTO blocks (id, options, message) VALUES (?, ?, ?)`,
        [blockId, JSON.stringify(options), JSON.stringify(['Hello'])],
      );

      const escapeLikePattern = (value: string) =>
        value.replace(/[%_]/g, '\\$&');
      const pattern = `%"content":%"entity":"${escapeLikePattern(
        created.id,
      )}"%`;
      const match = await dataSource
        .createQueryBuilder()
        .select('1')
        .from('blocks', 'block')
        .where('block.options LIKE :pattern', { pattern })
        .limit(1)
        .getRawOne();
      expect(match).toBeDefined();

      await expect(repository.deleteOne(created.id)).rejects.toThrow(
        ForbiddenException,
      );

      const contentType = await repository.findOne({
        where: { id: created.id },
      });
      expect(contentType).not.toBeNull();

      await dataSource.query(`DELETE FROM blocks WHERE id = ?`, [blockId]);
      await repository.deleteOne(created.id);
    });
  });

  describe('deleteOne cascade', () => {
    it('removes related contents when deleting a content type', async () => {
      const created = await repository.create({
        name: `cascade-${randomUUID()}`,
        fields: buildRequiredFields(),
      });

      await contentRepository.create({
        title: 'related-content-a',
        contentType: created.id,
        status: true,
        dynamicFields: {},
      });
      await contentRepository.create({
        title: 'related-content-b',
        contentType: created.id,
        status: true,
        dynamicFields: {},
      });

      const result = await repository.deleteOne(created.id);

      expect(result.deletedCount).toBe(1);

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
