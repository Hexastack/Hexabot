/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException } from '@nestjs/common';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from 'typeorm';

import { JsonColumn } from '@/database/decorators/json-column.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';

import { Setting, SettingTransformerDto } from '../dto/setting.dto';
import { SettingSchema, SettingValue } from '../types';
import {
  cloneSettingSchema,
  getSettingConfig,
  getSettingDefault,
  getSettingOptions,
  getSettingValidationError,
  withSettingDefault,
} from '../utils/setting-schema-definition.utils';

@Entity({ name: 'settings' })
@Index(['group', 'label'])
export class SettingOrmEntity extends BaseOrmEntity<SettingTransformerDto> {
  plainCls = Setting;

  fullCls = Setting;

  @Column()
  @Index()
  group!: string;

  @Column({ nullable: true })
  subgroup?: string;

  @Column()
  @Index()
  label!: string;

  @JsonColumn()
  schema!: SettingSchema;

  get value(): SettingValue | undefined {
    return getSettingDefault(this.schema);
  }

  set value(value: SettingValue | undefined) {
    this.schema = withSettingDefault(this.schema ?? {}, value);
  }

  get options(): string[] | undefined {
    return getSettingOptions(this.schema);
  }

  get config(): Record<string, any> | undefined {
    return getSettingConfig(this.schema);
  }

  @Column({ default: 0 })
  weight?: number;

  @Column({ default: false })
  translatable?: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  protected validateValueBeforePersist(): void {
    this.schema = cloneSettingSchema(this.schema);
    this.assertValidValue();
  }

  private assertValidValue(): void {
    const error = getSettingValidationError(this.schema, this.value);

    if (error) {
      throw new BadRequestException(error);
    }
  }
}
