/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ConflictException, Logger } from '@nestjs/common';
import {
  BeforeRemove,
  BeforeUpdate,
  Brackets,
  Column,
  Entity,
  In,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Not,
  OneToOne,
  RelationId,
  Repository,
} from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { SettingService } from '@/setting/services/setting.service';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { CaptureVar } from '../types/capture-var';
import { BlockMessage } from '../types/message';
import { BlockOptions } from '../types/options';
import { Pattern } from '../types/pattern';
import { Position } from '../types/position';

import { CategoryOrmEntity } from './category.entity';
import { ConversationOrmEntity } from './conversation.entity';
import { LabelOrmEntity } from './label.entity';

@Entity({ name: 'blocks' })
@Index(['name'])
export class BlockOrmEntity extends BaseOrmEntity {
  private static readonly logger = new Logger(BlockOrmEntity.name);

  private static settingServiceProvider?: () => SettingService;

  private categoryUpdateScope?: Set<string>;

  @Column()
  name!: string;

  @Column({ type: 'json' })
  patterns: Pattern[] = [];

  @Column({ type: 'json' })
  outcomes: string[] = [];

  @ManyToMany(() => LabelOrmEntity, (label) => label.triggerBlocks, {
    cascade: false,
  })
  @JoinTable({
    name: 'block_trigger_labels',
    joinColumn: { name: 'block_id' },
    inverseJoinColumn: { name: 'label_id' },
  })
  @AsRelation({ allowArray: true })
  trigger_labels: LabelOrmEntity[];

  @RelationId((block: BlockOrmEntity) => block.trigger_labels)
  private readonly triggerLabelIds!: string[];

  @ManyToMany(() => LabelOrmEntity, (label) => label.assignedBlocks, {
    cascade: false,
  })
  @JoinTable({
    name: 'block_assign_labels',
    joinColumn: { name: 'block_id' },
    inverseJoinColumn: { name: 'label_id' },
  })
  @AsRelation({ allowArray: true })
  assign_labels: LabelOrmEntity[];

  @RelationId((block: BlockOrmEntity) => block.assign_labels)
  private readonly assignLabelIds!: string[];

  @Column({ type: 'json' })
  trigger_channels: string[] = [];

  @Column({ type: 'json' })
  options: BlockOptions = {} as BlockOptions;

  @Column({ type: 'json' })
  message!: BlockMessage;

  @ManyToMany(() => BlockOrmEntity, (block) => block.previousBlocks, {
    cascade: false,
  })
  @JoinTable({
    name: 'block_next_blocks',
    joinColumn: { name: 'block_id' },
    inverseJoinColumn: { name: 'next_block_id' },
  })
  @AsRelation({ allowArray: true })
  nextBlocks: BlockOrmEntity[];

  @RelationId((block: BlockOrmEntity) => block.nextBlocks)
  private readonly nextBlockIds!: string[];

  @ManyToMany(() => BlockOrmEntity, (block) => block.nextBlocks)
  @AsRelation({ allowArray: true })
  previousBlocks?: BlockOrmEntity[];

  @OneToOne(() => BlockOrmEntity, (block) => block.attachedToBlock, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'attached_block_id' })
  @AsRelation()
  attachedBlock?: BlockOrmEntity | null;

  @RelationId((block: BlockOrmEntity) => block.attachedBlock)
  private readonly attachedBlockId?: string | null;

  @OneToOne(() => BlockOrmEntity, (block) => block.attachedBlock)
  @AsRelation()
  attachedToBlock?: BlockOrmEntity | null;

  @ManyToOne(() => CategoryOrmEntity, (category) => category.blocks, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'category_id' })
  @AsRelation()
  category: CategoryOrmEntity | null;

  @RelationId((block: BlockOrmEntity) => block.category)
  private readonly categoryId: string | null;

  @Column({ default: false })
  starts_conversation!: boolean;

  @Column({ type: 'json' })
  capture_vars: CaptureVar[] = [];

  @Column({ type: 'json', nullable: true })
  position?: Position | null;

  @Column({ default: false })
  builtin!: boolean;

  @BeforeUpdate()
  protected async handleBeforeUpdate(): Promise<void> {
    await this.ensureCategoryTransitionsAreClean();
  }

  @BeforeRemove()
  protected async ensureDeletable(): Promise<void> {
    const blockId = this.id;
    if (!blockId) {
      return;
    }

    const manager = BlockOrmEntity.getEntityManager();
    const inUse = await manager
      .createQueryBuilder(ConversationOrmEntity, 'conversation')
      .leftJoin('conversation.next', 'nextBlocks')
      .where('conversation.active = :active', { active: true })
      .andWhere(
        new Brackets((where) => {
          where
            .where('conversation.current_block_id = :blockId', { blockId })
            .orWhere('nextBlocks.id = :blockId', { blockId });
        }),
      )
      .getOne();

    if (inUse) {
      throw new ConflictException(
        'Cannot delete block: it is currently used by an active conversation.',
      );
    }

    const settingService = BlockOrmEntity.getSettingService();
    const settings = await settingService.getSettings();
    const fallbackBlockId = settings?.chatbot_settings?.fallback_block;
    const isGlobalFallbackEnabled = settings?.chatbot_settings?.global_fallback;

    if (
      isGlobalFallbackEnabled &&
      fallbackBlockId &&
      fallbackBlockId === blockId
    ) {
      throw new ConflictException(
        'Cannot delete block: it is configured as the global fallback block in settings.',
      );
    }

    await BlockOrmEntity.removeReferencesToBlocks([blockId]);
  }

  static registerSettingServiceProvider(provider: () => SettingService): void {
    this.settingServiceProvider = provider;
  }

  registerCategoryUpdateScope(ids: Iterable<string>): void {
    this.categoryUpdateScope = new Set(
      Array.from(ids).filter(
        (id): id is string => typeof id === 'string' && id.length > 0,
      ),
    );
  }

  static async removeReferencesToBlocks(ids: string[]): Promise<void> {
    const validIds = ids.filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );

    if (!validIds.length) {
      return;
    }

    await this.removeAttachedBlockReferences(validIds);
    await this.removeNextBlockReferences(validIds);
  }

  private getCategoryUpdateScopeIds(): string[] {
    if (this.categoryUpdateScope && this.categoryUpdateScope.size > 0) {
      return Array.from(this.categoryUpdateScope);
    }

    return typeof this.id === 'string' && this.id.length > 0 ? [this.id] : [];
  }

  private clearCategoryUpdateScope(): void {
    this.categoryUpdateScope = undefined;
  }

  private async ensureCategoryTransitionsAreClean(): Promise<void> {
    const scopeIds = this.getCategoryUpdateScopeIds();
    if (!scopeIds.length) {
      this.clearCategoryUpdateScope();
      return;
    }

    const nextCategoryId = this.category?.id ?? null;
    if (!nextCategoryId) {
      this.clearCategoryUpdateScope();
      return;
    }

    const repository = BlockOrmEntity.getRepository();
    const previous = await repository.findOne({
      where: { id: this.id },
      relations: ['category'],
    });

    const previousCategoryId = previous?.category?.id ?? null;
    if (nextCategoryId === previousCategoryId) {
      this.clearCategoryUpdateScope();
      return;
    }

    const scopeSet = new Set(scopeIds);
    const isScopeLeader =
      typeof this.id === 'string' && scopeIds.length > 0
        ? scopeIds[0] === this.id
        : false;

    if (Array.isArray(this.nextBlocks) && this.nextBlocks.length) {
      this.nextBlocks = this.nextBlocks.filter(
        (next) => next?.id && scopeSet.has(next.id),
      );
    }

    if (
      this.attachedBlock &&
      (!this.attachedBlock.id || !scopeSet.has(this.attachedBlock.id))
    ) {
      this.attachedBlock = null;
    }

    if (isScopeLeader) {
      await BlockOrmEntity.prepareBlocksInCategoryUpdateScope(
        nextCategoryId,
        scopeIds,
      );

      await BlockOrmEntity.prepareBlocksOutOfCategoryUpdateScope(
        previousCategoryId,
        scopeIds,
      );

      await BlockOrmEntity.removeReferencesToBlocks(scopeIds);
    }

    this.clearCategoryUpdateScope();
  }

  static async prepareBlocksInCategoryUpdateScope(
    categoryId: string,
    ids: string[],
  ): Promise<void> {
    if (!categoryId || !ids.length) {
      return;
    }

    const repository = this.getRepository();
    const blocks = await repository.find({
      where: {
        id: In(ids),
        category: {
          id: Not(categoryId),
        },
      },
      relations: ['nextBlocks', 'attachedBlock', 'category'],
    });

    if (!blocks.length) {
      return;
    }

    const scope = new Set(ids);
    const updated: BlockOrmEntity[] = [];

    for (const block of blocks) {
      let changed = false;

      if (Array.isArray(block.nextBlocks) && block.nextBlocks.length) {
        const filteredNext = block.nextBlocks.filter(
          (next) => next?.id && scope.has(next.id),
        );
        if (filteredNext.length !== block.nextBlocks.length) {
          block.nextBlocks = filteredNext;
          changed = true;
        }
      }

      const attachedId = block.attachedBlock?.id ?? null;
      if (attachedId && !scope.has(attachedId)) {
        block.attachedBlock = null;
        changed = true;
      }

      if (changed) {
        updated.push(block);
      }
    }

    if (updated.length) {
      await repository.save(updated);
    }
  }

  static async prepareBlocksOutOfCategoryUpdateScope(
    sourceCategoryId: string | null,
    ids: string[],
  ): Promise<void> {
    if (!sourceCategoryId || !ids.length) {
      return;
    }

    const repository = this.getRepository();
    const blocks = await repository.find({
      where: {
        id: Not(In(ids)),
        category: {
          id: sourceCategoryId,
        },
      },
      relations: ['nextBlocks', 'attachedBlock'],
    });

    if (!blocks.length) {
      return;
    }

    const scope = new Set(ids);
    const updated: BlockOrmEntity[] = [];

    for (const block of blocks) {
      let changed = false;

      const attachedId = block.attachedBlock?.id ?? null;
      if (attachedId && scope.has(attachedId)) {
        block.attachedBlock = null;
        changed = true;
      }

      if (Array.isArray(block.nextBlocks) && block.nextBlocks.length) {
        const filteredNext = block.nextBlocks.filter(
          (next) => next?.id && !scope.has(next.id),
        );
        if (filteredNext.length !== block.nextBlocks.length) {
          block.nextBlocks = filteredNext;
          changed = true;
        }
      }

      if (changed) {
        updated.push(block);
      }
    }

    if (updated.length) {
      await repository.save(updated);
    }
  }

  private static async removeAttachedBlockReferences(
    ids: string[],
  ): Promise<void> {
    const repository = this.getRepository();
    const blocks = await repository.find({
      where: {
        attachedBlock: {
          id: In(ids),
        },
      },
      relations: ['attachedBlock'],
    });

    if (!blocks.length) {
      return;
    }

    for (const block of blocks) {
      block.attachedBlock = null;
    }

    await repository.save(blocks);
  }

  private static async removeNextBlockReferences(ids: string[]): Promise<void> {
    const repository = this.getRepository();
    const blocks = await repository
      .createQueryBuilder('block')
      .leftJoinAndSelect('block.nextBlocks', 'nextBlocks')
      .where('nextBlocks.id IN (:...ids)', { ids })
      .getMany();

    if (!blocks.length) {
      return;
    }

    for (const block of blocks) {
      block.nextBlocks = block.nextBlocks.filter(
        (nextBlock) => !ids.includes(nextBlock.id),
      );
    }

    await repository.save(blocks);
  }

  private static getRepository(): Repository<BlockOrmEntity> {
    return this.getEntityManager().getRepository(BlockOrmEntity);
  }

  private static getSettingService(): SettingService {
    if (!this.settingServiceProvider) {
      throw new Error(
        'Setting service provider not registered for BlockOrmEntity',
      );
    }

    const service = this.settingServiceProvider();
    if (!service) {
      throw new Error(
        'Setting service provider returned no instance for BlockOrmEntity',
      );
    }

    return service;
  }
}
