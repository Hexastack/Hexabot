/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeepPartial,
  EntityManager,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  Repository,
  UpdateEvent,
} from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Menu,
  MenuDtoConfig,
  MenuFull,
  MenuTransformerDto,
} from '../dto/menu.dto';
import { MenuOrmEntity, MenuType } from '../entities/menu.entity';

@EventSubscriber()
@Injectable()
export class MenuRepository
  extends BaseOrmRepository<MenuOrmEntity, MenuTransformerDto, MenuDtoConfig>
  implements EntitySubscriberInterface<MenuOrmEntity>
{
  constructor(
    @InjectRepository(MenuOrmEntity)
    repository: Repository<MenuOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: Menu,
      FullCls: MenuFull,
    });
  }

  protected override async preCreate(
    entity: DeepPartial<MenuOrmEntity> | MenuOrmEntity,
  ): Promise<void> {
    this.normalizeParentReference(entity);
    await this.validateMenu(entity, this.repository.manager);
  }

  protected override async preUpdate(
    current: MenuOrmEntity,
    changes: DeepPartial<MenuOrmEntity>,
  ): Promise<void> {
    this.normalizeParentReference(changes);

    if (
      Object.prototype.hasOwnProperty.call(changes, 'type') &&
      changes.type !== undefined &&
      changes.type !== current.type
    ) {
      throw new Error("Illegal Update: can't update type");
    }

    await this.validateMenu(
      {
        ...current,
        ...changes,
      },
      this.repository.manager,
    );
  }

  listenTo(): typeof MenuOrmEntity {
    return MenuOrmEntity;
  }

  async beforeInsert(event: InsertEvent<MenuOrmEntity>): Promise<void> {
    if (!event.entity) return;
    this.normalizeParentReference(event.entity);
    await this.validateMenu(event.entity, event.manager);
  }

  async beforeUpdate(event: UpdateEvent<MenuOrmEntity>): Promise<void> {
    if (!event.entity || !event.databaseEntity) return;

    this.normalizeParentReference(event.entity);

    const typeColumn = event.metadata.findColumnWithPropertyName('type');
    const isTypeUpdated =
      !!typeColumn &&
      event.updatedColumns.some(
        (column) => column.propertyName === typeColumn.propertyName,
      );

    if (isTypeUpdated) {
      throw new Error("Illegal Update: can't update type");
    }

    const mergedEntity: DeepPartial<MenuOrmEntity> = {
      ...(event.databaseEntity as MenuOrmEntity),
      ...(event.entity as MenuOrmEntity),
    };

    await this.validateMenu(mergedEntity, event.manager);
  }

  private async validateMenu(
    menu: DeepPartial<MenuOrmEntity>,
    manager: EntityManager,
  ): Promise<void> {
    if (!menu.type) {
      throw new Error("Menu Validation Error: 'type' is required");
    }

    await this.ensureValidParent(menu, manager);

    switch (menu.type) {
      case MenuType.postback: {
        const payload =
          'payload' in menu ? (menu.payload as string | null) : null;
        if (!payload) {
          throw new Error(
            "Menu Validation Error: doesn't include payload for type postback",
          );
        }
        break;
      }
      case MenuType.web_url: {
        const url = 'url' in menu ? (menu.url as string | null) : null;
        if (!url) {
          throw new Error(
            "Menu Validation Error: doesn't include url for type web_url",
          );
        }
        break;
      }
      case MenuType.nested:
      default:
        break;
    }
  }

  private async ensureValidParent(
    menu: DeepPartial<MenuOrmEntity>,
    manager: EntityManager,
  ): Promise<void> {
    const { parentId, hasParentValue, parentEntity } =
      this.resolveParentReference(menu);

    if (!hasParentValue || parentId === null) {
      return;
    }

    const menuId =
      typeof menu.id === 'string'
        ? menu.id
        : (menu as Record<string, unknown>).id;

    if (typeof menuId === 'string' && parentId === menuId) {
      throw new ConflictException(
        "Menu Validation Error: can't self reference",
      );
    }

    let parent = parentEntity as MenuOrmEntity | null;

    if (!parent || !parent.type) {
      parent = await manager.findOne(MenuOrmEntity, {
        where: { id: parentId },
      });
    }

    if (!parent) {
      throw new NotFoundException('The parent of this object does not exist');
    }

    if (parent.type !== MenuType.nested) {
      throw new ConflictException("Cant't nest non nested menu");
    }
  }

  private normalizeParentReference(menu: DeepPartial<MenuOrmEntity>): void {
    const { parentId, hasParentValue } = this.resolveParentReference(menu);
    if (!hasParentValue) {
      return;
    }

    const target = menu as Record<string, unknown>;
    target.parent = parentId ? ({ id: parentId } as MenuOrmEntity) : null;
    target.parentId = parentId ?? null;
  }

  private resolveParentReference(menu: DeepPartial<MenuOrmEntity>): {
    parentId: string | null;
    parentEntity: DeepPartial<MenuOrmEntity> | null;
    hasParentValue: boolean;
  } {
    let parentId: string | null | undefined;
    let parentEntity: DeepPartial<MenuOrmEntity> | null = null;
    let hasParentValue = false;

    if ('parent' in menu) {
      hasParentValue = true;
      const parentValue = menu.parent as unknown;

      if (typeof parentValue === 'string') {
        parentId = parentValue;
      } else if (parentValue && typeof parentValue === 'object') {
        parentEntity = parentValue as DeepPartial<MenuOrmEntity>;
        const candidateId = (parentEntity as Record<string, unknown>).id;
        if (typeof candidateId === 'string') {
          parentId = candidateId;
        }
      } else if (parentValue === null) {
        parentId = null;
      }
    }

    if (
      parentId === undefined &&
      'parentId' in menu &&
      menu.parentId !== undefined
    ) {
      hasParentValue = true;
      const parentIdValue = menu.parentId as unknown;
      if (typeof parentIdValue === 'string') {
        parentId = parentIdValue;
      } else if (parentIdValue === null) {
        parentId = null;
      }
    }

    return {
      parentId: parentId ?? null,
      parentEntity,
      hasParentValue,
    };
  }
}
