/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { randomUUID } from 'crypto';

import { plainToInstance } from 'class-transformer';
import { BeforeInsert, BeforeUpdate, PrimaryColumn } from 'typeorm';
import type { ZodTypeAny } from 'zod';

import { DatetimeColumn } from '@/database/decorators/datetime-column.decorator';
import { InferTransformDto, TDto } from '@/utils';

export abstract class BaseOrmEntity<Dto extends TDto = TDto> {
  abstract plainCls: Dto['transformers']['plain'];

  abstract fullCls: Dto['transformers']['full'];

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

  private isZodSchema(value: unknown): value is ZodTypeAny {
    return (
      typeof value === 'object' &&
      value !== null &&
      'parse' in value &&
      typeof (value as { parse?: unknown }).parse === 'function' &&
      'safeParse' in value &&
      typeof (value as { safeParse?: unknown }).safeParse === 'function'
    );
  }

  private stripTransformerFields<T>(
    value: T,
    seen: WeakMap<object, unknown> = new WeakMap(),
  ): T {
    if (typeof value !== 'object' || value === null || value instanceof Date) {
      return value;
    }

    const cached = seen.get(value);
    if (cached !== undefined) {
      return cached as T;
    }

    if (Array.isArray(value)) {
      const clonedArray: unknown[] = [];
      seen.set(value, clonedArray);
      for (const entry of value) {
        clonedArray.push(this.stripTransformerFields(entry, seen));
      }

      return clonedArray as T;
    }

    const source = value as Record<PropertyKey, unknown>;
    const clone = Object.create(Object.getPrototypeOf(source)) as Record<
      PropertyKey,
      unknown
    >;
    seen.set(value, clone);

    for (const key of Reflect.ownKeys(source)) {
      if (key === 'plainCls' || key === 'fullCls' || key === '__dtoType') {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(source, key);
      if (!descriptor) {
        continue;
      }

      if ('value' in descriptor) {
        descriptor.value = this.stripTransformerFields(descriptor.value, seen);
      }

      Object.defineProperty(clone, key, descriptor);
    }

    return clone as T;
  }

  private transform<T>(target: unknown): T {
    if (this.isZodSchema(target)) {
      return target.parse(this) as T;
    }

    const source = this.stripTransformerFields(this);

    return plainToInstance(target as any, source, {
      exposeUnsetFields: false,
    });
  }

  public toPlainCls(): InferTransformDto<Dto['transformers']['plain']> {
    return this.transform<InferTransformDto<Dto['transformers']['plain']>>(
      this.plainCls,
    );
  }

  public toFullCls(): InferTransformDto<Dto['transformers']['full']> {
    return this.transform<InferTransformDto<Dto['transformers']['full']>>(
      this.fullCls,
    );
  }
}
