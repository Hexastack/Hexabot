/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { ConflictException } from '@nestjs/common';
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
import { SettingOrmEntity } from '@/setting/entities/setting.entity';
import { SettingType } from '@/setting/types';
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

import { BlockCreateDto, BlockFull } from '../dto/block.dto';

import { BlockRepository } from './block.repository';

describe('BlockRepository (TypeORM)', () => {
  let module: TestingModule;
  let blockRepository: BlockRepository;
  let blockOrmRepository: Repository<BlockOrmEntity>;
  let categoryRepository: Repository<CategoryOrmEntity>;
  let conversationRepository: Repository<ConversationOrmEntity>;
  let subscriberRepository: Repository<SubscriberOrmEntity>;
  let settingRepository: Repository<SettingOrmEntity>;

  let hasNextBlock: BlockFull;
  let hasPreviousBlock: BlockFull;
  let defaultCategoryId: string;

  const createdBlockIds: string[] = [];
  const createdCategoryIds: string[] = [];
  const createdConversationIds: string[] = [];
  const createdSubscriberIds: string[] = [];
  const createdSettingIds: string[] = [];

  beforeAll(async () => {
    const testing = await buildTestingMocks({
      autoInjectFrom: ['providers'],
      providers: [BlockRepository],
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
    categoryRepository = module.get<Repository<CategoryOrmEntity>>(
      getRepositoryToken(CategoryOrmEntity),
    );
    conversationRepository = module.get<Repository<ConversationOrmEntity>>(
      getRepositoryToken(ConversationOrmEntity),
    );
    subscriberRepository = module.get<Repository<SubscriberOrmEntity>>(
      getRepositoryToken(SubscriberOrmEntity),
    );
    settingRepository = module.get<Repository<SettingOrmEntity>>(
      getRepositoryToken(SettingOrmEntity),
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

  const buildBlockPayload = (
    overrides: Partial<BlockCreateDto> = {},
  ): BlockCreateDto => ({
    name: `block-${randomUUID()}`,
    patterns: ['pattern'],
    outcomes: [],
    trigger_labels: [],
    assign_labels: [],
    trigger_channels: [],
    options: {},
    message: ['hello'],
    nextBlocks: [],
    attachedBlock: null,
    category: defaultCategoryId,
    starts_conversation: false,
    capture_vars: [],
    position: { x: 0, y: 0 },
    ...overrides,
  });
  const createBlock = async (
    overrides: Partial<BlockCreateDto> = {},
  ): Promise<BlockFull> => {
    const payload = buildBlockPayload(overrides);
    const created = await blockRepository.create(payload);
    createdBlockIds.push(created.id);
    const full = await blockRepository.findOneAndPopulate(created.id);
    if (!full) {
      throw new Error('Failed to load created block');
    }

    return full;
  };
  const createCategory = async (label?: string): Promise<CategoryOrmEntity> => {
    const category = await categoryRepository.save(
      categoryRepository.create({
        label: label ?? `category-${randomUUID()}`,
        builtin: false,
        zoom: 100,
        offset: [0, 0],
      }),
    );
    createdCategoryIds.push(category.id);

    return category;
  };
  const createSubscriber = async (): Promise<SubscriberOrmEntity> => {
    const subscriber = await subscriberRepository.save(
      subscriberRepository.create({
        first_name: 'Test',
        last_name: 'User',
        locale: null,
        timezone: 0,
        language: null,
        gender: null,
        country: null,
        foreign_id: randomUUID(),
        labels: [],
        channel: { name: 'test-channel' },
        context: { vars: {} },
      }),
    );
    createdSubscriberIds.push(subscriber.id);

    return subscriber;
  };
  const createConversation = async (
    blockId: string,
    subscriberId: string,
  ): Promise<ConversationOrmEntity> => {
    const conversation = await conversationRepository.save(
      conversationRepository.create({
        sender: { id: subscriberId } as SubscriberOrmEntity,
        active: true,
        context: { vars: {} },
        current: { id: blockId } as BlockOrmEntity,
        next: [],
      }),
    );
    createdConversationIds.push(conversation.id);

    return conversation;
  };
  const createSetting = async (
    data: Partial<SettingOrmEntity> &
      Pick<SettingOrmEntity, 'group' | 'label' | 'type' | 'value'>,
  ): Promise<SettingOrmEntity> => {
    const setting = await settingRepository.save(
      settingRepository.create({
        subgroup: undefined,
        options: undefined,
        config: undefined,
        weight: 0,
        translatable: false,
        ...data,
      }),
    );
    createdSettingIds.push(setting.id);

    return setting;
  };

  afterEach(async () => {
    jest.clearAllMocks();

    if (createdConversationIds.length) {
      await conversationRepository.delete(createdConversationIds);
      createdConversationIds.length = 0;
    }

    if (createdSubscriberIds.length) {
      await subscriberRepository.delete(createdSubscriberIds);
      createdSubscriberIds.length = 0;
    }

    if (createdSettingIds.length) {
      await settingRepository.delete(createdSettingIds);
      createdSettingIds.length = 0;
    }

    if (createdBlockIds.length) {
      await blockOrmRepository.delete(createdBlockIds);
      createdBlockIds.length = 0;
    }

    if (createdCategoryIds.length) {
      await categoryRepository.delete(createdCategoryIds);
      createdCategoryIds.length = 0;
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

  describe('lifecycle hooks', () => {
    describe('@BeforeUpdate enforceCategoryConsistency', () => {
      it('detaches relationships that belong to another category before saving', async () => {
        const blockToMove = await createBlock({
          name: `move-${randomUUID()}`,
        });
        const relatedBlock = await createBlock({
          name: `related-${randomUUID()}`,
        });
        const upstreamBlock = await createBlock({
          name: `upstream-${randomUUID()}`,
        });

        await blockOrmRepository
          .createQueryBuilder()
          .relation(BlockOrmEntity, 'nextBlocks')
          .of(blockToMove.id)
          .add(relatedBlock.id);

        await blockRepository.updateOne(blockToMove.id, {
          attachedBlock: relatedBlock.id,
        });

        await blockRepository.updateOne(upstreamBlock.id, {
          attachedBlock: blockToMove.id,
        });

        const newCategory = await createCategory();
        const updatedBlock = await blockRepository.updateOne(blockToMove.id, {
          category: newCategory.id,
        });

        expect(updatedBlock.category).toBe(newCategory.id);

        const [reloadedBlock, reloadedRelated, reloadedUpstream] =
          await Promise.all([
            blockRepository.findOneAndPopulate(blockToMove.id),
            blockRepository.findOneAndPopulate(relatedBlock.id),
            blockRepository.findOneAndPopulate(upstreamBlock.id),
          ]);

        expect(reloadedBlock).not.toBeNull();
        expect(reloadedBlock!.category?.id).toBe(newCategory.id);
        expect(reloadedBlock!.nextBlocks ?? []).toHaveLength(0);
        expect(reloadedBlock!.attachedBlock ?? null).toBeNull();
        expect(reloadedBlock!.attachedToBlock ?? null).toBeNull();

        const previousIds = (reloadedRelated!.previousBlocks ?? []).map(
          (block) => block.id,
        );
        expect(previousIds).not.toContain(blockToMove.id);

        expect(reloadedUpstream!.attachedBlock ?? null).toBeNull();
      });
    });

    describe('@BeforeRemove ensureDeletable', () => {
      it('removes inbound references before deleting a block', async () => {
        const blockToDelete = await createBlock({
          name: `delete-${randomUUID()}`,
        });
        const attachmentSource = await createBlock({
          name: `attachment-${randomUUID()}`,
        });
        const flowSource = await createBlock({
          name: `flow-${randomUUID()}`,
        });

        await blockRepository.updateOne(attachmentSource.id, {
          attachedBlock: blockToDelete.id,
        });

        await blockOrmRepository
          .createQueryBuilder()
          .relation(BlockOrmEntity, 'nextBlocks')
          .of(flowSource.id)
          .add(blockToDelete.id);

        const result = await blockRepository.deleteOne(blockToDelete.id);

        expect(result.deletedCount).toBe(1);

        const [updatedAttachmentSource, updatedFlowSource] = await Promise.all([
          blockRepository.findOneAndPopulate(attachmentSource.id),
          blockRepository.findOneAndPopulate(flowSource.id),
        ]);

        expect(updatedAttachmentSource!.attachedBlock ?? null).toBeNull();

        const downstreamIds = (updatedFlowSource!.nextBlocks ?? []).map(
          (block) => block.id,
        );
        expect(downstreamIds).not.toContain(blockToDelete.id);
      });

      it('prevents deletion when the block participates in an active conversation', async () => {
        const blockInUse = await createBlock({
          name: `in-use-${randomUUID()}`,
        });
        const subscriber = await createSubscriber();
        await createConversation(blockInUse.id, subscriber.id);

        await expect(
          blockRepository.deleteOne(blockInUse.id),
        ).rejects.toBeInstanceOf(ConflictException);
      });

      it('prevents deletion when the block is configured as the global fallback', async () => {
        const fallbackBlock = await createBlock({
          name: `fallback-${randomUUID()}`,
        });

        await createSetting({
          group: 'chatbot_settings',
          label: 'fallback_block',
          type: SettingType.select,
          value: fallbackBlock.id,
        });

        await createSetting({
          group: 'chatbot_settings',
          label: 'global_fallback',
          type: SettingType.checkbox,
          value: true,
        });

        await expect(
          blockRepository.deleteOne(fallbackBlock.id),
        ).rejects.toBeInstanceOf(ConflictException);
      });
    });
  });
});
