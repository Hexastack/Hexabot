/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FindOneOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database';

import { EHook } from '../generics/base-orm.repository';

import { DtoAction, DtoActionConfig, InferActionDto } from './dto.types';

export type EmitEventProps<
  Entity extends BaseOrmEntity,
  H extends EHook,
  ActionDto extends DtoActionConfig,
> = { action: EHook } & (H extends EHook.preCreate
  ? {
      entity: Entity;
      payload: InferActionDto<DtoAction.Create, ActionDto>;
    }
  : H extends EHook.postCreate
    ? { entity: Entity; payload: InferActionDto<DtoAction.Create, ActionDto> }
    : H extends EHook.preUpdate
      ? {
          entity: Entity;
          payload: InferActionDto<DtoAction.Update, ActionDto>;
          databaseEntity: Entity;
        }
      : H extends EHook.postUpdate
        ? {
            entity: Entity;
            payload: InferActionDto<DtoAction.Update, ActionDto>;
            databaseEntity: Entity;
          }
        : H extends EHook.preDelete
          ? {
              entity?: Entity;
              payload: string | FindOneOptions<Entity>;
              databaseEntity: Entity;
            }
          : H extends EHook.postDelete
            ? {
                entity?: Entity;
                payload: string | FindOneOptions<Entity>;
                databaseEntity: Entity;
              }
            : {});
