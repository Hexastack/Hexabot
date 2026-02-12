/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { plainToInstance } from 'class-transformer';
import {
  BeforeInsert,
  BeforeUpdate,
  EntityManager,
  PrimaryColumn,
} from 'typeorm';

import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { InferTransformDto } from '@/utils';

export abstract class BaseOrmEntity<
  TransformerDto extends {
    FullCls: unknown;
    PlainCls: unknown;
  } = {
    FullCls: unknown;
    PlainCls: unknown;
  },
> {
  private static entityManagerProvider?: () => EntityManager;

  abstract plainCls: TransformerDto['PlainCls'];

  abstract fullCls: TransformerDto['FullCls'];

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

  static registerEntityManagerProvider(provider: () => EntityManager): void {
    this.entityManagerProvider = provider;
  }

  protected static getEntityManager(): EntityManager {
    if (!this.entityManagerProvider) {
      throw new Error(
        `Entity manager provider not registered for ${this.name}`,
      );
    }

    try {
      const manager = this.entityManagerProvider();
      if (!manager) {
        throw new Error('Entity manager provider returned no manager');
      }

      return manager;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Unable to resolve entity manager for ${this.name}: ${reason}`,
      );
    }
  }

  public toPlainCls(): InferTransformDto<TransformerDto['PlainCls']> {
    return plainToInstance(this.plainCls as any, this, {
      exposeUnsetFields: false,
    });
  }

  public toFullCls(): InferTransformDto<TransformerDto['FullCls']> {
    return plainToInstance(this.fullCls as any, this, {
      exposeUnsetFields: false,
    });
  }
}
