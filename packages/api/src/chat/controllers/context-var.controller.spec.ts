/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { In } from 'typeorm';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { ContextVarOrmEntity } from '@/chat/entities/context-var.entity';
import { ConversationOrmEntity } from '@/chat/entities/conversation.entity';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import {
  contextVarFixtures,
  installContextVarFixturesTypeOrm,
} from '@/utils/test/fixtures/contextvar';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import {
  ContextVar,
  ContextVarCreateDto,
  ContextVarUpdateDto,
} from '../dto/context-var.dto';
import { ContextVarService } from '../services/context-var.service';

import { ContextVarController } from './context-var.controller';

const createUniqueValue = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

describe('ContextVarController (TypeORM)', () => {
  let module: TestingModule;
  let contextVarController: ContextVarController;
  let contextVarService: ContextVarService;

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['controllers'],
      controllers: [ContextVarController],
      typeorm: {
        entities: [
          ContextVarOrmEntity,
          BlockOrmEntity,
          CategoryOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          SubscriberOrmEntity,
          AttachmentOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
          ConversationOrmEntity,
        ],
        fixtures: installContextVarFixturesTypeOrm,
      },
    });

    module = testing.module;

    [contextVarController, contextVarService] = await testing.getMocks([
      ContextVarController,
      ContextVarService,
    ]);
  });

  afterEach(jest.clearAllMocks);

  afterAll(async () => {
    if (module) {
      await module.close();
    }
    await closeTypeOrmConnections();
  });

  describe('filterCount', () => {
    it('should count context variables', async () => {
      const expectedCount = await contextVarService.count({});
      const countSpy = jest.spyOn(contextVarService, 'count');
      const result = await contextVarController.filterCount();

      expect(countSpy).toHaveBeenCalledWith({});
      expect(result).toEqual({ count: expectedCount });
    });
  });

  describe('findPage', () => {
    it('should return context variables', async () => {
      const expected = await contextVarService.find({});
      const findSpy = jest.spyOn(contextVarService, 'find');
      const result = await contextVarController.findPage({});

      expect(findSpy).toHaveBeenCalledWith({});
      expect(result).toEqualPayload(expected);
    });
  });

  describe('findOne', () => {
    it('should return an existing context variable', async () => {
      const expectedFixture = contextVarFixtures.find(
        ({ label }) => label === 'test context var 1',
      )!;
      expect(expectedFixture).toBeDefined();

      const existing = (await contextVarService.findOne({
        where: { label: expectedFixture.label },
      }))!;
      expect(existing).toBeDefined();

      const findOneSpy = jest.spyOn(contextVarService, 'findOne');
      const result = await contextVarController.findOne(existing.id);

      expect(findOneSpy).toHaveBeenCalledWith(existing.id);
      expect(result).toEqualPayload(expectedFixture);
    });

    it('should throw NotFoundException when context variable does not exist', async () => {
      const id = randomUUID();
      const findOneSpy = jest
        .spyOn(contextVarService, 'findOne')
        .mockResolvedValueOnce(null);

      await expect(contextVarController.findOne(id)).rejects.toThrow(
        new NotFoundException(`ContextVar with ID ${id} not found`),
      );
      expect(findOneSpy).toHaveBeenCalledWith(id);
    });
  });

  describe('create', () => {
    it('should create a context variable', async () => {
      const payload: ContextVarCreateDto = {
        label: createUniqueValue('contextvar'),
        name: createUniqueValue('name'),
        permanent: false,
      };
      const createSpy = jest.spyOn(contextVarService, 'create');
      const result = await contextVarController.create(payload);

      expect(createSpy).toHaveBeenCalledWith(payload);
      expect(result).toEqualPayload(payload);

      await contextVarService.deleteOne(result.id);
    });
  });

  describe('updateOne', () => {
    it('should update an existing context variable', async () => {
      const created = await contextVarService.create({
        label: createUniqueValue('contextvar'),
        name: createUniqueValue('name'),
        permanent: false,
      });
      const updates: ContextVarUpdateDto = {
        permanent: true,
        name: createUniqueValue('updated'),
      };
      const updateSpy = jest.spyOn(contextVarService, 'updateOne');
      const result = await contextVarController.updateOne(created.id, updates);

      expect(updateSpy).toHaveBeenCalledWith(created.id, updates);
      expect(result.id).toBe(created.id);
      expect(result.permanent).toBe(true);
      expect(result.name).toBe(updates.name);

      await contextVarService.deleteOne(result.id);
    });

    it('should throw NotFoundException when updating a non-existing context variable', async () => {
      const id = randomUUID();

      await expect(
        contextVarController.updateOne(id, { permanent: true }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteOne', () => {
    it('should delete a context variable by id', async () => {
      const deletable = await contextVarService.create({
        label: createUniqueValue('contextvar'),
        name: createUniqueValue('name'),
        permanent: false,
      });
      const deleteSpy = jest.spyOn(contextVarService, 'deleteOne');
      const result = await contextVarController.deleteOne(deletable.id);

      expect(deleteSpy).toHaveBeenCalledWith(deletable.id);
      expect(result).toEqualPayload({ acknowledged: true, deletedCount: 1 });

      const lookup = await contextVarService.findOne(deletable.id);
      expect(lookup).toBeNull();
    });

    it('should throw NotFoundException when deletion result is empty', async () => {
      const id = randomUUID();
      const deleteSpy = jest
        .spyOn(contextVarService, 'deleteOne')
        .mockResolvedValueOnce({ acknowledged: true, deletedCount: 0 });

      await expect(contextVarController.deleteOne(id)).rejects.toThrow(
        new NotFoundException(`ContextVar with ID ${id} not found`),
      );
      expect(deleteSpy).toHaveBeenCalledWith(id);
    });
  });

  describe('deleteMany', () => {
    it('should delete multiple context variables', async () => {
      const created: ContextVar[] = await contextVarService.createMany([
        {
          label: createUniqueValue('contextvar'),
          name: createUniqueValue('name'),
        },
        {
          label: createUniqueValue('contextvar'),
          name: createUniqueValue('name'),
        },
      ]);
      const ids = created.map(({ id }) => id);
      const result = await contextVarController.deleteMany(ids);

      expect(result).toEqualPayload({
        acknowledged: true,
        deletedCount: ids.length,
      });

      const remaining = await contextVarService.find({
        where: { id: In(ids) },
      });
      expect(remaining).toHaveLength(0);
    });

    it('should throw NotFoundException when provided IDs do not exist', async () => {
      const ids = [randomUUID(), randomUUID()];

      await expect(contextVarController.deleteMany(ids)).rejects.toThrow(
        new NotFoundException('Context vars with provided IDs not found'),
      );
    });

    it('should throw BadRequestException when no IDs are provided', async () => {
      await expect(contextVarController.deleteMany([])).rejects.toThrow(
        new BadRequestException('No IDs provided for deletion.'),
      );
    });
  });
});
