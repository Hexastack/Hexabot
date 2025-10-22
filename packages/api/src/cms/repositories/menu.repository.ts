/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';

import {
  Menu,
  MenuDtoConfig,
  MenuFull,
  MenuTransformerDto,
} from '../dto/menu.dto';
import { MenuOrmEntity } from '../entities/menu.entity';

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
    MenuOrmEntity.registerEntityManagerProvider(() => repository.manager);
  }
}
