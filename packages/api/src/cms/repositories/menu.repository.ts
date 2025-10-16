/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import { Menu, MenuType } from '../entities/menu.entity';

@Injectable()
export class MenuRepository extends BaseOrmRepository<Menu> {
  constructor(
    @InjectRepository(Menu)
    repository: Repository<Menu>,
  ) {
    super(repository);
  }

  protected override async preCreate(
    entity: DeepPartial<Menu> | Menu,
  ): Promise<void> {
    this.validateMenu(entity);
  }

  protected override async preUpdate(
    current: Menu,
    changes: DeepPartial<Menu>,
  ): Promise<void> {
    if ('type' in changes) {
      throw new Error("Illegal Update: can't update type");
    }

    this.validateMenu({
      ...current,
      ...changes,
    });
  }

  private validateMenu(menu: DeepPartial<Menu> | Menu): void {
    if (!menu.type) {
      throw new Error("Menu Validation Error: 'type' is required");
    }

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
}
