/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { IHookSettingsGroupLabelOperationMap } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, UpdateEvent } from 'typeorm';

import { BaseOrmRepository } from '@/utils/generics/base-orm.repository';
import { DtoAction, InferActionDto } from '@/utils/types/dto.types';

import { SettingDtoConfig } from '../dto/setting.dto';
import { SettingOrmEntity } from '../entities/setting.entity';

@Injectable()
export class SettingRepository extends BaseOrmRepository<
  SettingOrmEntity,
  SettingDtoConfig
> {
  constructor(
    @InjectRepository(SettingOrmEntity)
    repository: Repository<SettingOrmEntity>,
  ) {
    super(repository, []);
  }

  public actionDtoToEntity(
    data: InferActionDto<DtoAction, SettingDtoConfig>,
  ): DeepPartial<SettingOrmEntity> {
    if (
      data &&
      typeof data === 'object' &&
      'value' in data &&
      !('schema' in data)
    ) {
      return data as DeepPartial<SettingOrmEntity>;
    }

    return super.actionDtoToEntity(data);
  }

  /**
   * Emits an event after a `Setting` has been updated.
   *
   * This method is used to synchronize global settings by emitting an event
   * based on the `group` and `label` of the `Setting`.
   */
  async afterUpdate(event: UpdateEvent<SettingOrmEntity>): Promise<void> {
    if (event.databaseEntity) {
      const setting = event.databaseEntity.toPlainCls();
      const group = setting.group as keyof IHookSettingsGroupLabelOperationMap;
      const label = setting.label as '*';
      this.eventEmitter?.emit(`hook:${group}:${label}`, setting);
    }

    await super.afterUpdate(event);
  }
}
