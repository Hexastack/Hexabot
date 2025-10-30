/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BadRequestException } from '@nestjs/common';
import { BeforeInsert, BeforeUpdate, Column, Entity, Index } from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';

import { SettingType } from '../types';

@Entity({ name: 'settings' })
@Index(['group', 'label'])
export class SettingOrmEntity extends BaseOrmEntity {
  @Column()
  @Index()
  group!: string;

  @Column({ nullable: true })
  subgroup?: string;

  @Column()
  @Index()
  label!: string;

  @Column({ type: 'simple-enum', enum: SettingType })
  type!: SettingType;

  @Column({ type: 'json', nullable: true })
  value: any;

  @Column({ type: 'json', nullable: true })
  options?: string[];

  @Column({ type: 'json', nullable: true })
  config?: Record<string, any>;

  @Column({ default: 0 })
  weight?: number;

  @Column({ default: false })
  translatable?: boolean;

  @BeforeInsert()
  @BeforeUpdate()
  protected validateValueBeforePersist(): void {
    this.assertValidValue();
  }

  private assertValidValue(): void {
    const value = this.value;
    switch (this.type) {
      case SettingType.text:
      case SettingType.textarea:
        if (typeof value !== 'string' && value !== null) {
          throw new BadRequestException('Setting value must be a string.');
        }
        break;
      case SettingType.multiple_text:
        if (!this.isArrayOfString(value)) {
          throw new BadRequestException(
            'Setting value must be an array of strings.',
          );
        }
        break;
      case SettingType.checkbox:
        if (typeof value !== 'boolean' && value !== null) {
          throw new BadRequestException('Setting value must be a boolean.');
        }
        break;
      case SettingType.number:
        if (typeof value !== 'number' && value !== null) {
          throw new BadRequestException('Setting value must be a number.');
        }
        break;
      case SettingType.multiple_attachment:
        if (!this.isArrayOfString(value)) {
          throw new BadRequestException(
            'Setting value must be an array of attachment ids.',
          );
        }
        break;
      case SettingType.attachment:
        if (typeof value !== 'string' && value !== null) {
          throw new BadRequestException(
            'Setting value must be a string or null.',
          );
        }
        break;
      case SettingType.secret:
        if (typeof value !== 'string') {
          throw new BadRequestException('Setting value must be a string.');
        }
        break;
      case SettingType.select:
        if (typeof value !== 'string') {
          throw new BadRequestException('Setting value must be a string.');
        }
        break;
      default:
        break;
    }
  }

  private isArrayOfString(value: unknown): value is string[] {
    return (
      Array.isArray(value) && value.every((item) => typeof item === 'string')
    );
  }
}
