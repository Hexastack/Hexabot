/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Column, Entity, Index } from 'typeorm';

import { EntityDto } from '@/database/decorators/dto-transforms.decorator';
import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Setting, SettingDto } from '../dto/setting.dto';

@Entity({ name: 'settings' })
@Index(['group', 'label'])
@EntityDto<SettingDto>({ plain: Setting, full: Setting })
export class SettingOrmEntity extends BaseOrmEntity<SettingDto> {
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
