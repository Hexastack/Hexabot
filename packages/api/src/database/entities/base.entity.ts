/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { plainToInstance } from 'class-transformer';
import { BeforeInsert, BeforeUpdate, PrimaryColumn } from 'typeorm';

import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { getDtoClassesMetadata } from '@/database/decorators/dto-transforms.decorator';
import { InferTransformDto, TDto } from '@/utils';

export abstract class BaseOrmEntity<Dto extends TDto = TDto> {
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

  public get plainCls(): Dto['transformers']['plain'] {
    const metadata = getDtoClassesMetadata(this.constructor);
    if (!metadata) {
      throw new Error(
        `Missing @DtoClasses metadata on entity "${this.constructor.name}".`,
      );
    }

    return metadata.plain as Dto['transformers']['plain'];
  }

  public get fullCls(): Dto['transformers']['full'] {
    const metadata = getDtoClassesMetadata(this.constructor);
    if (!metadata) {
      throw new Error(
        `Missing @DtoClasses metadata on entity "${this.constructor.name}".`,
      );
    }

    return metadata.full as Dto['transformers']['full'];
  }

  public toPlainCls(): InferTransformDto<Dto['transformers']['plain']> {
    return plainToInstance(this.plainCls as any, this, {
      exposeUnsetFields: false,
    });
  }

  public toFullCls(): InferTransformDto<Dto['transformers']['full']> {
    return plainToInstance(this.fullCls as any, this, {
      exposeUnsetFields: false,
    });
  }
}
