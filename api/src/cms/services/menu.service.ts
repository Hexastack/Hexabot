/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cache } from 'cache-manager';

import { MENU_CACHE_KEY } from '@/utils/constants/cache';
import { Cacheable } from '@/utils/decorators/cacheable.decorator';
import { BaseService } from '@/utils/generics/base-service';

import { MenuCreateDto, MenuDto } from '../dto/menu.dto';
import { MenuRepository } from '../repositories/menu.repository';
import { Menu, MenuFull, MenuPopulate } from '../schemas/menu.schema';
import { AnyMenu, MenuTree, MenuType } from '../schemas/types/menu';

@Injectable()
export class MenuService extends BaseService<
  Menu,
  MenuPopulate,
  MenuFull,
  MenuDto
> {
  private RootSymbol: symbol = Symbol('RootMenu');

  constructor(
    readonly repository: MenuRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(repository);
  }

  /**
   * Creates a new menu item. Validates whether the parent exists and if it's a nested menu.
   * If the parent menu is not of type 'nested', a conflict exception is thrown.
   *
   * @param dto - The data transfer object containing the menu details to create.
   *
   * @returns The newly created menu entity.
   */
  public async create(dto: MenuCreateDto): Promise<Menu> {
    if (dto.parent) {
      // check if parent exists in database
      const parent = await this.findOne(dto.parent);
      if (!parent)
        throw new NotFoundException('The parent of this object does not exist');
      // Check if that parent is nested
      if (parent.type !== MenuType.nested)
        throw new ConflictException("Cant't nest non nested menu");
    }
    return super.create(dto);
  }

  /**
   * Recursively deletes a menu node and its descendants. This ensures all children of the node
   * are deleted before the node itself.
   *
   * @param id - The ID of the menu node to be deleted.
   *
   * @returns The count of deleted nodes including the node and its descendants.
   */
  public async deepDelete(id: string) {
    const node = await this.findOne(id);
    if (node) {
      const children = await this.find({ parent: node.id });
      // count is the number of deleted nodes, at least the current node would be deleted + number of nodes in deleted subtrees
      const count = (
        await Promise.all(children.map((child) => this.deepDelete(child.id)))
      ).reduce((prev, curr) => prev + curr, 1);

      // finally delete the current node
      await this.deleteOne(id);
      return count;
    } else return 0;
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
