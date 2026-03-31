/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Exclude, Expose } from 'class-transformer';

import { BaseOrmEntity } from '@/database/entities/base.entity';

export type Ctor<T = unknown> = abstract new (...args: any[]) => T;

@Exclude()
export class BaseIdStub {
  @Expose()
  id!: string;
}

@Exclude()
export class BaseStub extends BaseIdStub {
  @Expose()
  id!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}

export enum DtoTransformer {
  PlainCls = 'PlainCls',
  FullCls = 'FullCls',
}

export enum DtoAction {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type DtoActionConfig<
  A extends Partial<Record<DtoAction, object>> = Partial<
    Record<DtoAction, object>
  >,
> = A;

export type DtoTransformerConfig<
  T extends Record<DtoTransformer, any> = Record<DtoTransformer, any>,
> = T;

export type InferActionDto<
  K extends DtoAction,
  Dto extends DtoActionConfig,
  Fallback = unknown,
> = K extends keyof Dto ? Dto[K] : Fallback;

export type InferTransformDto<T> = T extends new (...args: unknown[]) => infer R
  ? R
  : T extends { prototype: infer P }
    ? P
    : unknown;

export type InferDto<Entity extends BaseOrmEntity<any>> = Entity['__dtoType'];

export type BuildDto<
  actions extends DtoActionConfig,
  transformers extends DtoTransformerConfig,
> = { actions: actions; transformers: transformers };

export type EntityDto<Entity extends BaseOrmEntity> = BuildDto<
  DtoActionConfig,
  {
    FullCls: Entity['fullCls'];
    PlainCls: Entity['plainCls'];
  }
>;
