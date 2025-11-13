/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmEntity } from '@hexabot/core/database';
import { AsRelation } from '@hexabot/core/decorators';
import {
  BeforeInsert,
  BeforeUpdate,
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  RelationId,
} from 'typeorm';

import { EnumColumn } from '@/database/decorators/enum-column.decorator';

export enum MenuType {
  web_url = 'web_url',
  postback = 'postback',
  nested = 'nested',
}

@Entity({ name: 'menus' })
@Index(['parent'])
@Check(
  'Menu value and type mismatch',
  `
  (
    ("type" = 'postback' AND "payload" IS NOT NULL AND "url" IS NULL) OR
    ("type" = 'web_url'  AND "url"     IS NOT NULL AND "payload" IS NULL) OR
    ("type" = 'nested'   AND "payload" IS NULL     AND "url"     IS NULL)
  )
`,
)
@Check(`"parent_id" IS NULL OR "id" <> "parent_id"`)
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
  @AsRelation()
  parent?: MenuOrmEntity | null;

  @RelationId((value: MenuOrmEntity) => value.parent)
  private readonly parentId?: string | null;

  /**
   * Type of the menu item, one of: web_url, postback, nested.
   */
  @EnumColumn({ enum: MenuType })
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

  @BeforeInsert()
  async handleBeforeInsert(): Promise<void> {
    await this.ensureValidParent();
  }

  @BeforeUpdate()
  async handleBeforeUpdate(): Promise<void> {
    await this.ensureValidParent();
  }

  private async ensureValidParent(): Promise<void> {
    const parentId = this.parent?.id;
    if (parentId) {
      // Ensure parent is nested
      const manager = MenuOrmEntity.getEntityManager();
      const parent = await manager.findOne(MenuOrmEntity, {
        where: { id: parentId },
      });

      if (parent?.type !== MenuType.nested) {
        throw new Error(
          'Menu Validation Error: parent should be of type "nested"',
        );
      }
    }
  }
}
