/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Menu,
  MenuDtoConfig,
  MenuFull,
  MenuTransformerDto,
} from '../dto/menu.dto';
import { MenuOrmEntity, MenuType } from '../entities/menu.entity';

@Injectable()
export class MenuRepository extends BaseOrmRepository<
  MenuOrmEntity,
  MenuTransformerDto,
  MenuDtoConfig
> {
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
    this.validateMenu(entity);
  }

  protected override async preUpdate(
    current: MenuOrmEntity,
    changes: DeepPartial<MenuOrmEntity>,
  ): Promise<void> {
    if ('type' in changes) {
      throw new Error("Illegal Update: can't update type");
    }

    this.validateMenu({
      ...current,
      ...changes,
    });
  }

  private validateMenu(menu: DeepPartial<MenuOrmEntity> | MenuOrmEntity): void {
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
