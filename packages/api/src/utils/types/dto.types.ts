/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Exclude, Expose } from 'class-transformer';
import type { ZodTypeAny } from 'zod';

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

export enum DtoType {
  PLAIN = 'plain',
  FULL = 'full',
}

export enum DtoAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
}

export type TDtoAction<
  A extends Partial<Record<DtoAction, object>> = Partial<
    Record<DtoAction, object>
  >,
> = A;

export type TDto<
  transformers extends {
    [K in DtoType]: unknown;
  } = {
    plain: unknown;
    full: unknown;
  },
  actions extends TDtoAction = TDtoAction,
> = { transformers: transformers; actions: actions };

export type TEntityDto<Entity extends BaseOrmEntity> = TDto<
  {
    plain: Entity['plainCls'];
    full: Entity['fullCls'];
  },
  TDtoAction
>;

export type InferEntityDto<
  K extends DtoAction,
  Entity extends BaseOrmEntity<TEntityDto<Entity>>,
  Dto extends TDtoAction = InferActionsDto<Entity>,
  Fallback = unknown,
> = K extends keyof Dto ? Dto[K] : Fallback;

export type InferCreateDto<Entity extends BaseOrmEntity<TEntityDto<Entity>>> =
  InferEntityDto<DtoAction.CREATE, Entity>;

export type InferUpdateDto<Entity extends BaseOrmEntity<TEntityDto<Entity>>> =
  InferEntityDto<DtoAction.UPDATE, Entity>;

export type InferActionsDto<Entity extends BaseOrmEntity<TEntityDto<Entity>>> =
  Entity['__dtoType']['actions'];

export type InferTransformDto<T> = T extends ZodTypeAny
  ? T['_output']
  : T extends new (...args: unknown[]) => infer R
    ? R
    : T extends { prototype: infer P }
      ? P
      : unknown;

export type InferPlain<Entity extends BaseOrmEntity<TEntityDto<Entity>>> =
  InferTransformDto<Entity['plainCls']>;

export type InferFull<Entity extends BaseOrmEntity<TEntityDto<Entity>>> =
  InferTransformDto<Entity['fullCls']>;
