/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

export enum MenuType {
  web_url = 'web_url',
  postback = 'postback',
  nested = 'nested',
}

@Entity({ name: 'menus' })
@Index(['parentId'])
export class MenuOrmEntity extends BaseOrmEntity {
  /**
   * The displayed title of the menu.
   */
  @Column()
  title!: string;

  /**
   * If this menu item is part of another nested menu (parent), this will indicate that parent.
   */
  @ManyToOne(() => MenuOrmEntity, (menu) => menu.children, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: MenuOrmEntity | null;

  @Column({ name: 'parent_id', type: 'varchar', nullable: true })
  parentId?: string | null;

  /**
   * Type of the menu item, one of: web_url, postback, nested.
   */
  @Column({ type: 'varchar' })
  type!: MenuType;

  /**
   * The content of the payload, if the menu item type is postback.
   */
  @Column({ nullable: true, type: 'varchar' })
  payload?: string | null;

  /**
   * The url if the menu item is web_url.
   */
  @Column({ nullable: true, type: 'varchar' })
  url?: string | null;

  @OneToMany(() => MenuOrmEntity, (menu) => menu.parent)
  children?: MenuOrmEntity[];
}
