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
import { SettingType } from '../types';

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

  public validateSettingValue(type: SettingType, value: any) {
    if (
      (type === SettingType.text || type === SettingType.textarea) &&
      typeof value !== 'string' &&
      value !== null
    ) {
      throw new Error('Setting value must be a string.');
    } else if (type === SettingType.multiple_text) {
      if (!this.isArrayOfString(value)) {
        throw new Error('Setting value must be an array of strings.');
      }
    } else if (
      type === SettingType.checkbox &&
      typeof value !== 'boolean' &&
      value !== null
    ) {
      throw new Error('Setting value must be a boolean.');
    } else if (
      type === SettingType.number &&
      typeof value !== 'number' &&
      value !== null
    ) {
      throw new Error('Setting value must be a number.');
    } else if (type === SettingType.multiple_attachment) {
      if (!this.isArrayOfString(value)) {
        throw new Error('Setting value must be an array of attachment ids.');
      }
    } else if (type === SettingType.attachment) {
      if (typeof value !== 'string' && value !== null) {
        throw new Error('Setting value must be a string or null.');
      }
    } else if (type === SettingType.secret && typeof value !== 'string') {
      throw new Error('Setting value must be a string.');
    } else if (type === SettingType.select && typeof value !== 'string') {
      throw new Error('Setting value must be a string.');
    }
  }

  private isArrayOfString(value: any): boolean {
    return Array.isArray(value) && value.every((v) => typeof v === 'string');
  }
}
