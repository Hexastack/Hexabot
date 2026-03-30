/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FindOneOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database';

import { EHook } from '../generics/base-orm.repository';

import { DtoAction, DtoActionConfig, InferActionDto } from './dto.types';

type EventProps<
  Entity extends BaseOrmEntity,
  ActionDto extends DtoActionConfig,
> =
  | {
      action: EHook.preCreate;
      entity: Entity;
      payload: InferActionDto<DtoAction.Create, ActionDto>;
    }
  | {
      action: EHook.postCreate;
      entity: Entity;
      payload: InferActionDto<DtoAction.Create, ActionDto>;
    }
  | {
      action: EHook.preUpdate;
      entity: Entity;
      payload: InferActionDto<DtoAction.Update, ActionDto>;
      databaseEntity: Entity;
    }
  | {
      action: EHook.postUpdate;
      entity: Entity;
      payload: InferActionDto<DtoAction.Update, ActionDto>;
      databaseEntity: Entity;
    }
  | {
      action: EHook.preDelete;
      entity?: Entity;
      payload: string | FindOneOptions<Entity>;
      databaseEntity: Entity;
    }
  | {
      action: EHook.postDelete;
      entity?: Entity;
      payload: string | FindOneOptions<Entity>;
      databaseEntity: Entity;
    };

export type EmitEventProps<
  Entity extends BaseOrmEntity,
  H extends EHook,
  ActionDto extends DtoActionConfig,
> = Extract<EventProps<Entity, ActionDto>, { action: H }>;
