/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { FindOneOptions } from 'typeorm';

import { BaseOrmEntity } from '@/database';

import { EHook } from '../generics/base-orm.repository';

import {
  DtoAction,
  DtoActionConfig,
  EntityDto,
  InferActionDto,
  InferDto,
} from './dto.types';

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

export type EntityPostHookEvent = EmitEventProps<
  BaseOrmEntity,
  EHook.postCreate | EHook.postUpdate | EHook.postDelete,
  DtoActionConfig
> & { entityName: string };

export type EmitEventProps<
  Entity extends BaseOrmEntity,
  H extends EHook,
  ActionDto extends DtoActionConfig,
> = Extract<EventProps<Entity, ActionDto>, { action: H }>;

export type InsertEvent<
  Entity extends BaseOrmEntity<EntityDto<Entity>>,
  ActionDto extends DtoActionConfig = InferDto<Entity>['actions'],
> = Extract<
  EventProps<Entity, ActionDto>,
  | {
      action: EHook.preCreate;
      payload: InferActionDto<DtoAction.Create, ActionDto>;
    }
  | {
      action: EHook.postCreate;
      payload: InferActionDto<DtoAction.Create, ActionDto>;
    }
>;

export type UpdateEvent<
  Entity extends BaseOrmEntity<EntityDto<Entity>>,
  ActionDto extends DtoActionConfig = InferDto<Entity>['actions'],
> = Extract<
  EventProps<Entity, ActionDto>,
  | {
      action: EHook.preUpdate;
      payload: InferActionDto<DtoAction.Update, ActionDto>;
    }
  | {
      action: EHook.postUpdate;
      payload: InferActionDto<DtoAction.Update, ActionDto>;
    }
>;

export type RemoveEvent<
  Entity extends BaseOrmEntity<EntityDto<Entity>>,
  ActionDto extends DtoActionConfig = InferDto<Entity>['actions'],
> = Extract<
  EventProps<Entity, ActionDto>,
  | {
      action: EHook.preDelete;
      payload: InferActionDto<DtoAction.Delete, ActionDto>;
    }
  | {
      action: EHook.postDelete;
      payload: InferActionDto<DtoAction.Delete, ActionDto>;
    }
>;
