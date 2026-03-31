/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { plainToInstance } from 'class-transformer';
import { BeforeInsert, BeforeUpdate, PrimaryColumn } from 'typeorm';

import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { DtoActionConfig, InferTransformDto } from '@/utils';

export abstract class BaseOrmEntity<
  Dto extends {
    transformers: {
      FullCls: unknown;
      PlainCls: unknown;
    };
    actions: DtoActionConfig;
  } = {
    transformers: {
      FullCls: unknown;
      PlainCls: unknown;
    };
    actions: DtoActionConfig;
  },
> {
  abstract plainCls: Dto['transformers']['PlainCls'];

  abstract fullCls: Dto['transformers']['FullCls'];

  declare readonly __dtoType: Dto;

  @PrimaryColumn()
  id!: string;

  @DatetimeColumn({ name: 'created_at', nullable: true })
  createdAt!: Date;

  @DatetimeColumn({ name: 'updated_at', nullable: true })
  updatedAt!: Date;

  @BeforeInsert()
  protected setDefaults(): void {
    const now = new Date();
    if (!this.id) {
      this.id = randomUUID();
    }
    this.createdAt = this.createdAt ?? now;
    this.updatedAt = this.updatedAt ?? now;
  }

  @BeforeUpdate()
  protected touchUpdatedAt(): void {
    this.updatedAt = new Date();
  }

  public toPlainCls(): InferTransformDto<Dto['transformers']['PlainCls']> {
    return plainToInstance(this.plainCls as any, this, {
      exposeUnsetFields: false,
    });
  }

  public toFullCls(): InferTransformDto<Dto['transformers']['FullCls']> {
    return plainToInstance(this.fullCls as any, this, {
      exposeUnsetFields: false,
    });
  }
}
