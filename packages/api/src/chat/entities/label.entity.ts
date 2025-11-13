/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity } from '@hexabot/core/database';
import { AsRelation } from '@hexabot/core/decorators';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';

import { BlockOrmEntity } from './block.entity';
import { LabelGroupOrmEntity } from './label-group.entity';
import { SubscriberOrmEntity } from './subscriber.entity';

@Entity({ name: 'labels' })
@Index(['title'], { unique: true })
@Index(['name'], { unique: true })
export class LabelOrmEntity extends BaseOrmEntity {
  @Column()
  title!: string;

  @Column()
  name!: string;

  @ManyToOne(() => LabelGroupOrmEntity, (group) => group.labels, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'group_id' })
  @AsRelation()
  group?: LabelGroupOrmEntity | null;

  @RelationId((label: LabelOrmEntity) => label.group)
  private readonly groupId?: string | null;

  @JsonColumn({ nullable: true })
  label_id?: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ default: false })
  builtin!: boolean;

  @ManyToMany(() => SubscriberOrmEntity, (subscriber) => subscriber.labels)
  @AsRelation({ allowArray: true })
  users?: SubscriberOrmEntity[];

  @ManyToMany(() => BlockOrmEntity, (block) => block.trigger_labels)
  @AsRelation({ allowArray: true })
  triggerBlocks?: BlockOrmEntity[];

  @ManyToMany(() => BlockOrmEntity, (block) => block.assign_labels)
  @AsRelation({ allowArray: true })
  assignedBlocks?: BlockOrmEntity[];
}
