/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@hexabot/logger';
import { FieldType } from '@hexabot/setting/types';
import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { BlockService } from '@/chat/services/block.service';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import {
  contentTypeOrmFixtures,
  installContentTypeFixturesTypeOrm,
} from '@/utils/test/fixtures/contenttype';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { ContentTypeOrmEntity } from '../entities/content-type.entity';
import { ContentOrmEntity } from '../entities/content.entity';
import { ContentTypeRepository } from '../repositories/content-type.repository';
import { ContentTypeService } from '../services/content-type.service';

import { ContentTypeController } from './content-type.controller';

describe('ContentTypeController (TypeORM)', () => {
  let module: TestingModule;
  let controller: ContentTypeController;
  let service: ContentTypeService;
  let logger: LoggerService;
  const createdIds = new Set<string>();
  const blockServiceMock = {
    findOne: jest.fn().mockResolvedValue(null),
  };

  beforeAll(async () => {
    const { module: testingModule, getMocks } = await buildTestingMocks({
      controllers: [ContentTypeController],
      providers: [
        ContentTypeService,
        ContentTypeRepository,
        {
          provide: BlockService,
          useFactory: () => blockServiceMock,
        },
      ],
      typeorm: {
        entities: [
          ContentTypeOrmEntity,
          ContentOrmEntity,
          BlockOrmEntity,
          CategoryOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          SubscriberOrmEntity,
          UserOrmEntity,
          AttachmentOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
        ],
        fixtures: installContentTypeFixturesTypeOrm,
      },
    });
    module = testingModule;
    [controller, service] = await getMocks([
      ContentTypeController,
      ContentTypeService,
    ]);
    logger = (controller as any).logger as LoggerService;
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    for (const id of Array.from(createdIds)) {
      await service.deleteOne(id);
      createdIds.delete(id);
    }
  });

  describe('create', () => {
    it('creates a new content type', async () => {
      const payload = {
        name: 'Articles',
        fields: [
          {
            name: 'body',
            label: 'Body',
            type: FieldType.text,
          },
        ],
      };
      const created = await controller.create(payload);
      createdIds.add(created.id);

      expect(created).toMatchObject(payload);
    });
  });

  describe('find', () => {
    it('returns content types using find options', async () => {
      const result = await controller.find({ take: 5, skip: 0 });

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('filterCount', () => {
    it('returns filtered count', async () => {
      const result = await controller.filterCount({});

      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe('findOne', () => {
    it('returns an existing content type', async () => {
      const [fixture] = contentTypeOrmFixtures;
      const existing = await service.findOne({
        where: { name: fixture.name },
      });
      expect(existing).toBeDefined();

      const found = await controller.findOne(existing!.id);

      expect(found).toMatchObject({ id: existing!.id });
    });

    it('throws when not found', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(
        controller.findOne('00000000-0000-4000-8000-000000000000'),
      ).rejects.toThrow(NotFoundException);

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('updateOne', () => {
    it('updates an existing content type', async () => {
      const created = await controller.create({
        name: 'Docs',
        fields: [
          {
            name: 'description',
            label: 'Description',
            type: FieldType.text,
          },
        ],
      });
      createdIds.add(created.id);

      const updated = await controller.updateOne(
        { name: 'Docs Updated' },
        created.id,
      );

      expect(updated.name).toBe('Docs Updated');
    });
  });

  describe('deleteOne', () => {
    it('removes an existing content type', async () => {
      const created = await controller.create({
        name: 'Temporary',
        fields: [],
      });
      const result = await controller.deleteOne(created.id);

      expect(result).toEqual({ acknowledged: true, deletedCount: 1 });
      const found = await service.findOne(created.id);
      expect(found).toBeNull();
    });

    it('throws when deletion removes nothing', async () => {
      const warnSpy = jest.spyOn(logger, 'warn');

      await expect(
        controller.deleteOne('00000000-0000-4000-8000-000000000001'),
      ).rejects.toThrow(NotFoundException);

      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
