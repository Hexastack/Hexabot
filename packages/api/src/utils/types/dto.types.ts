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

export type BuildDtoType<
  transformers extends DtoTransformerConfig,
  actions extends DtoActionConfig,
> = { transformers: transformers; actions: actions };

export type EntityDto<Entity extends BaseOrmEntity> = BuildDtoType<
  {
    FullCls: Entity['fullCls'];
    PlainCls: Entity['plainCls'];
  },
  DtoActionConfig
>;

export type InferEntityDto<
  K extends DtoAction,
  Entity extends BaseOrmEntity<EntityDto<Entity>>,
  Dto extends DtoActionConfig = InferActionsDto<Entity>,
  Fallback = unknown,
> = K extends keyof Dto ? Dto[K] : Fallback;

export type InferCreateDto<Entity extends BaseOrmEntity<EntityDto<Entity>>> =
  InferEntityDto<DtoAction.Create, Entity>;

export type InferUpdateDto<Entity extends BaseOrmEntity<EntityDto<Entity>>> =
  InferEntityDto<DtoAction.Update, Entity>;

export type InferActionsDto<Entity extends BaseOrmEntity<EntityDto<Entity>>> =
  Entity['__dtoType']['actions'];

export type InferTransformDto<T> = T extends new (...args: unknown[]) => infer R
  ? R
  : T extends { prototype: infer P }
    ? P
    : unknown;

export type InferPlain<Entity extends BaseOrmEntity<EntityDto<Entity>>> =
  InferTransformDto<Entity['plainCls']>;

export type InferFull<Entity extends BaseOrmEntity<EntityDto<Entity>>> =
  InferTransformDto<Entity['fullCls']>;
