/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { IHookSettingsGroupLabelOperationMap } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateEvent } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { DtoTransformer } from '@/utils/types/dto.types';

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

  /**
   * Emits an event after a `Setting` has been updated.
   *
   * This method is used to synchronize global settings by emitting an event
   * based on the `group` and `label` of the `Setting`.
   */
  async afterUpdate(event: UpdateEvent<SettingOrmEntity>) {
    const setting = this.getTransformer(DtoTransformer.PlainCls)(
      event.databaseEntity,
    );
    const group = setting.group as keyof IHookSettingsGroupLabelOperationMap;
    const label = setting.label as '*';
    this.eventEmitter.emit(`hook:${group}:${label}`, setting);
  }
}
