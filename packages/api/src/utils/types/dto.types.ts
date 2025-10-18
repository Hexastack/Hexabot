/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Exclude, Expose } from 'class-transformer';

type Ctor<T = unknown> = abstract new (...args: any[]) => T;

// Get the instance type of a constructor (handles abstract)
type InstanceOf<C> = C extends abstract new (...args: any[]) => infer R
  ? R
  : C extends new (...args: any[]) => infer R
    ? R
    : never;

@Exclude()
export class BaseStub {
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
  T extends Record<DtoTransformer, Ctor> = Record<DtoTransformer, Ctor>,
> = T;

export type InferActionDto<
  K extends DtoAction,
  Dto extends DtoActionConfig,
  Fallback = unknown,
> = K extends keyof Dto ? Dto[K] : Fallback;

export type InferTransformDto<
  K extends DtoTransformer,
  Dto extends DtoTransformerConfig,
> = InstanceOf<Dto[K]>;
