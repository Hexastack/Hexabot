/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

export enum DtoAction {
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type DtoConfig<
  C extends Partial<Record<DtoAction, object>> = Partial<
    Record<DtoAction, object>
  >,
> = C;

export type DtoInfer<K extends keyof Dto, Dto, I> = Dto[K] extends object
  ? Dto[K]
  : I;
