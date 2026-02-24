/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

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
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { AsRelation } from '@/utils/decorators/relation-ref.decorator';

import { Menu, MenuFull, MenuTransformerDto } from '../dto/menu.dto';
import { MenuType } from '../enums/menu-type.enum';

export { MenuType };

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
export class MenuOrmEntity extends BaseOrmEntity<MenuTransformerDto> {
  plainCls = Menu;

  fullCls = MenuFull;

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
      if (this.id && parentId === this.id) {
        throw new Error(
          'Menu Validation Error: parent should not reference itself',
        );
      }

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
