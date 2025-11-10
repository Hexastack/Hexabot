/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { ConflictException } from '@nestjs/common';
import {
  BeforeRemove,
  BeforeUpdate,
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  RelationId,
} from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { SettingOrmEntity } from '@/setting/entities/setting.entity';
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
  @Column()
  name!: string;

  @JsonColumn()
  patterns: Pattern[] = [];

  @JsonColumn()
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

  @JsonColumn()
  trigger_channels: string[] = [];

  @JsonColumn()
  options: BlockOptions = {} as BlockOptions;

  @JsonColumn()
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

  @JsonColumn()
  capture_vars: CaptureVar[] = [];

  @JsonColumn({ nullable: true })
  position?: Position | null;

  @Column({ default: false })
  builtin!: boolean;

  @BeforeUpdate()
  protected async enforceCategoryConsistency(): Promise<void> {
    if (!this.id) {
      return;
    }

    const repository =
      BlockOrmEntity.getEntityManager().getRepository(BlockOrmEntity);
    const persistedBlock = await repository.findOne({
      where: { id: this.id },
      relations: [
        'category',
        'nextBlocks',
        'nextBlocks.category',
        'previousBlocks',
        'previousBlocks.category',
        'attachedBlock',
        'attachedBlock.category',
        'attachedToBlock',
        'attachedToBlock.category',
      ],
    });

    if (!persistedBlock) {
      return;
    }

    const previousCategoryId = persistedBlock.category?.id ?? null;
    const categoryProvided = Object.prototype.hasOwnProperty.call(
      this,
      'category',
    );
    const nextCategoryId = categoryProvided
      ? this.category
        ? this.category.id
        : null
      : (this.categoryId ?? previousCategoryId);

    if (previousCategoryId === nextCategoryId) {
      return;
    }

    const nextBlocksToDetach = (persistedBlock.nextBlocks ?? []).filter(
      (nextBlock) => (nextBlock.category?.id ?? null) !== nextCategoryId,
    );

    if (nextBlocksToDetach.length) {
      await repository
        .createQueryBuilder()
        .relation(BlockOrmEntity, 'nextBlocks')
        .of(this.id)
        .remove(nextBlocksToDetach.map((block) => block.id));

      if (this.nextBlocks) {
        this.nextBlocks = this.nextBlocks.filter(
          (block) =>
            !nextBlocksToDetach.some((toDetach) => toDetach.id === block.id),
        );
      }
    }

    const previousBlocksToDetach = (persistedBlock.previousBlocks ?? []).filter(
      (prevBlock) => (prevBlock.category?.id ?? null) !== nextCategoryId,
    );

    if (previousBlocksToDetach.length) {
      await repository
        .createQueryBuilder()
        .relation(BlockOrmEntity, 'nextBlocks')
        .of(previousBlocksToDetach.map((block) => block.id))
        .remove(this.id);
    }

    const attachedBlock = persistedBlock.attachedBlock;
    if (
      attachedBlock &&
      (attachedBlock.category?.id ?? null) !== nextCategoryId
    ) {
      await repository
        .createQueryBuilder()
        .relation(BlockOrmEntity, 'attachedBlock')
        .of(this.id)
        .set(null);

      if (this.attachedBlock && this.attachedBlock.id === attachedBlock.id) {
        this.attachedBlock = null;
      }
    }

    const attachedToBlock = persistedBlock.attachedToBlock;
    if (
      attachedToBlock &&
      (attachedToBlock.category?.id ?? null) !== nextCategoryId
    ) {
      await repository
        .createQueryBuilder()
        .relation(BlockOrmEntity, 'attachedBlock')
        .of(attachedToBlock.id)
        .set(null);
    }
  }

  @BeforeRemove()
  protected async ensureDeletable(): Promise<void> {
    if (!this.id) {
      return;
    }

    await this.removeReferencesToBlock();
    await this.ensureNotUsedInActiveConversations();
    await this.ensureNotConfiguredAsGlobalFallback();
  }

  async removeReferencesToBlock(): Promise<void> {
    await this.removeAttachedBlockReferences();
    await this.removeNextBlockReferences();
  }

  private async removeAttachedBlockReferences(): Promise<void> {
    const repository =
      BlockOrmEntity.getEntityManager().getRepository(BlockOrmEntity);
    const blocks = await repository.find({
      where: {
        attachedBlock: {
          id: this.id,
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

  private async removeNextBlockReferences(): Promise<void> {
    const repository =
      BlockOrmEntity.getEntityManager().getRepository(BlockOrmEntity);
    const blocks = await repository.find({
      where: {
        nextBlocks: {
          id: this.id,
        },
      },
      relations: ['nextBlocks'],
    });

    if (!blocks.length) {
      return;
    }

    for (const block of blocks) {
      block.nextBlocks = block.nextBlocks.filter(
        (nextBlock) => this.id !== nextBlock.id,
      );
    }

    await repository.save(blocks);
  }

  private async ensureNotUsedInActiveConversations(): Promise<void> {
    const conversationRepository =
      BlockOrmEntity.getEntityManager().getRepository(ConversationOrmEntity);
    const inUse = await conversationRepository.find({
      where: [
        { active: true, current: { id: this.id } },
        { active: true, next: { id: this.id } },
      ],
      relations: ['current', 'next'],
      take: 1,
    });

    if (inUse.length) {
      throw new ConflictException(
        'Cannot delete block: it is currently used by an active conversation.',
      );
    }
  }

  private async ensureNotConfiguredAsGlobalFallback(): Promise<void> {
    const manager = BlockOrmEntity.getEntityManager();
    const settingsRepository = manager.getRepository(SettingOrmEntity);
    const [fallbackSetting, globalFallbackSetting] = await Promise.all([
      settingsRepository.findOne({
        select: ['value'],
        where: {
          group: 'chatbot_settings',
          label: 'fallback_block',
        },
      }),
      settingsRepository.findOne({
        select: ['value'],
        where: {
          group: 'chatbot_settings',
          label: 'global_fallback',
        },
      }),
    ]);
    const fallbackValue = fallbackSetting?.value;
    const fallbackBlockId =
      typeof fallbackValue === 'string'
        ? fallbackValue
        : fallbackValue && typeof fallbackValue === 'object'
          ? String((fallbackValue as Record<string, unknown>).id ?? '') || null
          : null;
    const fallbackEnabledValue = globalFallbackSetting?.value;
    const isGlobalFallbackEnabled =
      fallbackEnabledValue === true || fallbackEnabledValue === 'true';

    if (
      fallbackBlockId &&
      fallbackBlockId === this.id &&
      isGlobalFallbackEnabled
    ) {
      throw new ConflictException(
        'Cannot delete block: it is configured as the global fallback block in settings.',
      );
    }
  }
}
