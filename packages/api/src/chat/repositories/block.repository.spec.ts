/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AttachmentOrmEntity } from '@/attachment/entities/attachment.entity';
import { DEFAULT_BLOCK_SEARCH_LIMIT } from '@/chat/constants/block';
import { BlockOrmEntity } from '@/chat/entities/block.entity';
import { CategoryOrmEntity } from '@/chat/entities/category.entity';
import { ConversationOrmEntity } from '@/chat/entities/conversation.entity';
import { LabelGroupOrmEntity } from '@/chat/entities/label-group.entity';
import { LabelOrmEntity } from '@/chat/entities/label.entity';
import { SubscriberOrmEntity } from '@/chat/entities/subscriber.entity';
import { SettingService } from '@/setting/services/setting.service';
import { ModelOrmEntity } from '@/user/entities/model.entity';
import { PermissionOrmEntity } from '@/user/entities/permission.entity';
import { RoleOrmEntity } from '@/user/entities/role.entity';
import { UserOrmEntity } from '@/user/entities/user.entity';
import {
  blockFixtures,
  installBlockFixturesTypeOrm,
} from '@/utils/test/fixtures/block';
import { closeTypeOrmConnections } from '@/utils/test/test';
import { buildTestingMocks } from '@/utils/test/utils';

import { BlockFull } from '../dto/block.dto';

import { BlockRepository } from './block.repository';

describe('BlockRepository (TypeORM)', () => {
  let module: TestingModule;
  let blockRepository: BlockRepository;
  let blockOrmRepository: Repository<BlockOrmEntity>;

  let hasNextBlock: BlockFull;
  let hasPreviousBlock: BlockFull;
  let defaultCategoryId: string;

  const createdBlockIds: string[] = [];

  beforeAll(async () => {
    const settingServiceMock = {
      getSettings: jest.fn().mockResolvedValue({
        chatbot_settings: {},
      }),
    };

    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [
        BlockRepository,
        {
          provide: SettingService,
          useValue: settingServiceMock,
        },
      ],
      typeorm: {
        entities: [
          BlockOrmEntity,
          CategoryOrmEntity,
          LabelOrmEntity,
          LabelGroupOrmEntity,
          SubscriberOrmEntity,
          ConversationOrmEntity,
          AttachmentOrmEntity,
          UserOrmEntity,
          RoleOrmEntity,
          PermissionOrmEntity,
          ModelOrmEntity,
        ],
        fixtures: installBlockFixturesTypeOrm,
      },
    });

    module = testing.module;
    blockRepository = module.get(BlockRepository);
    blockOrmRepository = module.get<Repository<BlockOrmEntity>>(
      getRepositoryToken(BlockOrmEntity),
    );

    const populatedBlocks = await blockRepository.findAndPopulate({
      order: { name: 'ASC' },
    });

    if (populatedBlocks.length !== blockFixtures.length) {
      throw new Error('Block fixtures were not loaded as expected');
    }

    const blockMap = new Map(
      populatedBlocks.map((block) => [block.name, block]),
    );

    hasNextBlock = blockMap.get('hasNextBlocks') as BlockFull;
    hasPreviousBlock = blockMap.get('hasPreviousBlocks') as BlockFull;

    if (!hasNextBlock || !hasPreviousBlock) {
      throw new Error('Required block fixtures are missing');
    }

    defaultCategoryId = hasNextBlock.category?.id ?? '';

    if (!defaultCategoryId) {
      throw new Error('Default category could not be resolved from fixtures');
    }
  });

  afterEach(async () => {
    jest.clearAllMocks();

    if (createdBlockIds.length) {
      await blockOrmRepository.delete(createdBlockIds);
      createdBlockIds.length = 0;
    }
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }

    await closeTypeOrmConnections();
  });

  describe('findOneAndPopulate', () => {
    it('loads a single block with its relations', async () => {
      const result = await blockRepository.findOneAndPopulate(hasNextBlock.id);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(hasNextBlock.id);
      expect(result!.category?.id).toBe(defaultCategoryId);

      const nextNames = (result!.nextBlocks ?? []).map((block) => block.name);
      expect(nextNames).toContain(hasPreviousBlock.name);

      expect(result!.previousBlocks ?? []).toHaveLength(0);
      expect(result!.attachedBlock ?? null).toBeNull();
      expect(result!.attachedToBlock ?? null).toBeNull();
      expect(result!.trigger_labels).toEqual([]);
      expect(result!.assign_labels).toEqual([]);
    });
  });

  describe('findAndPopulate', () => {
    it('hydrates relations for each block', async () => {
      const populated = await blockRepository.findAndPopulate({
        order: { name: 'ASC' },
      });

      expect(populated).toHaveLength(blockFixtures.length);
      populated.forEach((block) => {
        expect(block.category?.id).toBe(defaultCategoryId);
        expect(block.trigger_labels).toEqual([]);
        expect(block.assign_labels).toEqual([]);
      });

      const blockByName = new Map(
        populated.map((block) => [block.name, block]),
      );

      const nextBlock = blockByName.get('hasNextBlocks');
      expect(nextBlock).toBeDefined();
      expect((nextBlock!.nextBlocks ?? []).map((b) => b.name)).toEqual([
        'hasPreviousBlocks',
      ]);
      expect(nextBlock!.previousBlocks ?? []).toHaveLength(0);

      const previousBlock = blockByName.get('hasPreviousBlocks');
      expect(previousBlock).toBeDefined();
      expect((previousBlock!.previousBlocks ?? []).map((b) => b.name)).toEqual([
        'hasNextBlocks',
      ]);
    });
  });

  describe('findByContextVarName', () => {
    it('returns an empty array when the name is blank', async () => {
      const repositoryFindSpy = jest.spyOn(blockOrmRepository, 'find');

      const result = await blockRepository.findByContextVarName('');

      expect(result).toEqual([]);
      expect(repositoryFindSpy).not.toHaveBeenCalled();
    });

    it('finds blocks that capture the provided context variable', async () => {
      const contextVarName = `context_var_${randomUUID().replace(/-/g, '')}`;
      const created = await blockRepository.create({
        name: `context-block-${contextVarName}`,
        patterns: ['test'],
        outcomes: [],
        trigger_labels: [],
        assign_labels: [],
        trigger_channels: [],
        options: {},
        message: ['Hello'],
        nextBlocks: [],
        attachedBlock: null,
        category: defaultCategoryId,
        starts_conversation: false,
        capture_vars: [
          {
            entity: -1,
            context_var: contextVarName,
          },
        ],
        position: { x: 10, y: 20 },
      });

      createdBlockIds.push(created.id);

      const results =
        await blockRepository.findByContextVarName(contextVarName);

      expect(results.map((block) => block.id)).toContain(created.id);
    });
  });

  describe('search', () => {
    it('returns an empty array without querying the database when the search term is blank', async () => {
      const createQueryBuilderSpy = jest.spyOn(
        blockOrmRepository,
        'createQueryBuilder',
      );

      const result = await blockRepository.search('   ');

      expect(result).toEqual([]);
      expect(createQueryBuilderSpy).not.toHaveBeenCalled();
    });

    it('searches blocks by name', async () => {
      const results = await blockRepository.search(hasNextBlock.name, 10);

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.find((block) => block.id === hasNextBlock.id),
      ).toBeDefined();
    });

    it('searches blocks by message content', async () => {
      const results = await blockRepository.search('Hi back', 10);

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.find((block) => block.name === 'hasNextBlocks'),
      ).toBeDefined();
    });

    it('filters results by category when provided', async () => {
      const results = await blockRepository.search(
        hasNextBlock.name,
        10,
        defaultCategoryId,
      );

      expect(results.length).toBeGreaterThan(0);
      results.forEach((block) => {
        expect(block.category).toBe(defaultCategoryId);
      });
    });

    it('respects the requested limit and orders scores in descending order', async () => {
      const results = await blockRepository.search('block', 1);

      expect(results.length).toBeLessThanOrEqual(1);
      const scores = results.map((block) => block.score);
      const sortedScores = [...scores].sort((a, b) => b - a);
      expect(scores).toEqual(sortedScores);

      const cappedResults = await blockRepository.search(
        'block',
        DEFAULT_BLOCK_SEARCH_LIMIT + 5,
      );
      expect(cappedResults.length).toBeLessThanOrEqual(
        Math.min(blockFixtures.length, DEFAULT_BLOCK_SEARCH_LIMIT),
      );
    });
  });
});
