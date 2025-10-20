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
  Setting,
  SettingDtoConfig,
  SettingTransformerDto,
} from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';

@Injectable()
export class SettingRepository extends BaseOrmRepository<
  SettingOrmEntity,
  SettingTransformerDto,
  SettingDtoConfig
> {
  constructor(
    @InjectRepository(SettingOrmEntity)
    repository: Repository<SettingOrmEntity>,
  ) {
    super(repository, [], {
      PlainCls: Setting,
      FullCls: Setting,
    });
  }
}
