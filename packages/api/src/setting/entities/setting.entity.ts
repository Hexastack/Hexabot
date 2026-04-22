/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { settingSchema, settingFullSchema } from '@hexabot-ai/types';
import { Column, Entity, Index } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { SettingDto } from '../dto/setting.dto';

@Entity({ name: 'settings' })
@Index(['group', 'label'])
export class SettingOrmEntity extends BaseOrmEntity<SettingDto> {
  plainCls = settingSchema;

  fullCls = settingFullSchema;

  @Column()
  @Index()
  group!: string;

  @Column({ nullable: true })
  subgroup?: string;

  @Column()
  @Index()
  label!: string;

  @JsonColumn({ nullable: true })
  value: any;
}
