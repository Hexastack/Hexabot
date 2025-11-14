/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';

import { MENU_CACHE_KEY } from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseOrmService } from '@/utils/generics/base-orm.service';

import { MenuDtoConfig, MenuTransformerDto } from '../dto/menu.dto';
import { MenuOrmEntity, MenuType } from '../entities/menu.entity';
import { MenuRepository } from '../repositories/menu.repository';
import { AnyMenu, MenuTree } from '../types/menu';

@Injectable()
export class MenuService extends BaseOrmService<
  MenuOrmEntity,
  MenuTransformerDto,
  MenuDtoConfig,
  MenuRepository
> {
  private readonly RootSymbol: symbol = Symbol('RootMenu');

  constructor(
    readonly repository: MenuRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(repository);
  }

  /**
   * Groups menu items by their parent. It organizes them into a map where the key is the parent ID,
   * and the value is an array of its children. If the menu has no parent, it's grouped under the RootSymbol.
   *
   * @param menuItems - An array of menu items to group.
   *
   * @returns A map where the key is the parent ID (or RootSymbol), and the value is an array of child menu items.
   */
  private groupByParents(
    menuItems: AnyMenu[],
  ): Map<string | symbol, AnyMenu[]> {
    const parents: Map<string | symbol, AnyMenu[]> = new Map();

    parents.set(this.RootSymbol, []);
    menuItems.forEach((menuItem) => {
      const menuParent = menuItem.parent?.toString();
      if (!menuItem.parent) {
        parents.get(this.RootSymbol)!.push(menuItem);

        return;
      }
      if (menuParent) {
        if (parents.has(menuParent)) {
          parents.get(menuParent)!.push(menuItem);

          return;
        }

        parents.set(menuParent, [menuItem]);
      }
    });

    return parents;
  }

  /**
   * Builds a tree of menus from the grouped menu items. Each node contains its children recursively.
   *
   * @param parents - A map where keys are parent IDs and values are arrays of child menu items.
   * @param parent - The parent ID to start building the tree from. Defaults to RootSymbol.
   *
   * @returns A hierarchical tree of menus.
   */
  private buildTree(
    parents: Map<string | symbol, AnyMenu[]>,
    parent: string | symbol = this.RootSymbol,
  ): MenuTree {
    const item = parents.get(parent);
    if (!item) {
      return [];
    }
    const children: MenuTree = item.map((menu) => {
      return {
        ...menu,
        call_to_actions:
          menu.type === MenuType.nested
            ? this.buildTree(parents, menu.id) || []
            : undefined,
      };
    });

    return children;
  }

  /**
   * Event handler that listens to menu-related events. On receiving such an event, it invalidates the cached menu data.
   */
  @OnEvent('hook:menu:*')
  async handleMenuUpdateEvent() {
    await this.cacheManager.del(MENU_CACHE_KEY);
  }

  /**
   * Retrieves the full hierarchical tree of menu items. It caches the result to improve performance.
   *
   * @returns The complete menu tree.
   */
  @Cacheable(MENU_CACHE_KEY)
  public async getTree() {
    const menuItems = (await this.findAll()) as AnyMenu[];
    const parents = this.groupByParents(menuItems);

    return this.buildTree(parents);
  }
}
