/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Inject, NotFoundException } from '@nestjs/common';
import {
  EventEmitter2,
  IHookEntities,
  TNormalizedEvents,
} from '@nestjs/event-emitter';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import camelCase from 'lodash/camelCase';
import {
  DeepPartial,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository,
} from 'typeorm';

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LoggerService } from '@/logger/logger.service';

import {
  DtoAction,
  DtoActionConfig,
  DtoTransformer,
  DtoTransformerConfig,
  InferActionDto,
  InferTransformDto,
} from '../types/dto.types';

import { DeleteResult, EHook } from './base-repository';

export type UpdateOneOptions = {
  upsert?: boolean;
};

export type FindAllOptions<EntityType> = Omit<
  FindManyOptions<EntityType>,
  'where'
> & {
  where?: never;
};

type RepositoryWhere<EntityType> =
  | FindOptionsWhere<EntityType>
  | FindOptionsWhere<EntityType>[]
  | undefined;

export abstract class BaseOrmRepository<
  Entity extends BaseOrmEntity,
  TransformerDto extends DtoTransformerConfig,
  ActionDto extends DtoActionConfig,
> {
  protected constructor(
    protected readonly repository: Repository<Entity>,
    protected readonly populateRelations: string[] = [],
    protected readonly transformers: TransformerDto,
  ) {}

  getPopulateRelations(): readonly string[] {
    return this.populateRelations;
  }

  canPopulate(populate: string[]): boolean {
    if (!Array.isArray(populate) || populate.length === 0) {
      return false;
    }

    return populate.every((relation) =>
      this.populateRelations.includes(relation),
    );
  }

  getEventEmitter(): EventEmitter2 | undefined {
    return this.eventEmitter;
  }

  @Inject(EventEmitter2)
  protected readonly eventEmitter: EventEmitter2;

  @Inject(LoggerService)
  protected readonly logger: LoggerService;

  public getTransformer<D extends DtoTransformer>(t: D) {
    return (entity: Entity): InferTransformDto<D, TransformerDto> => {
      return plainToInstance(this.transformers[t] as any, entity, {
        exposeUnsetFields: false,
      });
    };
  }

  public actionDtoToEntity(
    data: InferActionDto<DtoAction, ActionDto>,
  ): DeepPartial<Entity> {
    const e = plainToInstance(
      this.repository.target as new (...args: any[]) => Entity,
      instanceToPlain(data),
    );
    return Object.assign(e) as DeepPartial<Entity>;
  }

  async findAll(
    options: FindAllOptions<Entity> = {} as FindAllOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    const entities = await this.findAllEntities(options);
    return entities.map(this.getTransformer(DtoTransformer.PlainCls));
  }

  private async findAllEntities(
    options: FindAllOptions<Entity> = {} as FindAllOptions<Entity>,
  ): Promise<Entity[]> {
    return await this.repository.find(options as FindManyOptions<Entity>);
  }

  async findAllAndPopulate(
    options: FindAllOptions<Entity> = {} as FindAllOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]> {
    const populatedEntities = await this.repository.find(
      this.withPopulateRelations(options as FindManyOptions<Entity>, true),
    );
    return populatedEntities.map(this.getTransformer(DtoTransformer.FullCls));
  }

  async find(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    const entities = await this.findEntities(options);
    return entities.map(this.getTransformer(DtoTransformer.PlainCls));
  }

  private async findEntities(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
    populate = false,
  ): Promise<Entity[]> {
    const finalOptions = this.withPopulateRelations(options, populate);
    return await this.repository.find(finalOptions);
  }

  private withPopulateRelations<
    T extends FindManyOptions<Entity> | FindOneOptions<Entity>,
  >(options: T, populate: boolean): T {
    if (!populate || this.populateRelations.length === 0) {
      return options;
    }

    const finalOptions = { ...(options ?? {}) } as T;
    const currentRelations = (finalOptions as any).relations;

    if (!currentRelations) {
      (finalOptions as any).relations = this.populateRelations;
      return finalOptions;
    }

    if (Array.isArray(currentRelations)) {
      (finalOptions as any).relations = Array.from(
        new Set([...currentRelations, ...this.populateRelations]),
      );
    }

    return finalOptions;
  }

  async findAndPopulate(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto>[]> {
    const entities = await this.findEntities(options, true);
    return entities.map(this.getTransformer(DtoTransformer.FullCls));
  }

  async count(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
  ): Promise<number> {
    return await this.repository.count(options);
  }

  async findOne(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferTransformDto<
    DtoTransformer.PlainCls,
    TransformerDto
  > | null> {
    const entity = await this.findOneEntity(idOrOptions);
    return entity ? this.getTransformer(DtoTransformer.PlainCls)(entity) : null;
  }

  private async findOneEntity(
    idOrOptions: string | FindOneOptions<Entity>,
    populate = false,
  ): Promise<Entity | null> {
    if (typeof idOrOptions === 'string') {
      const options = this.withPopulateRelations<FindOneOptions<Entity>>(
        {
          where: { id: idOrOptions } as FindOptionsWhere<Entity>,
        },
        populate,
      );
      return (await this.repository.findOne(options)) ?? null;
    }

    const options = this.withPopulateRelations(idOrOptions, populate);
    return (await this.repository.findOne(options)) ?? null;
  }

  async findOneAndPopulate(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferTransformDto<DtoTransformer.FullCls, TransformerDto> | null> {
    const entity = await this.findOneEntity(idOrOptions, true);
    return entity ? this.getTransformer(DtoTransformer.FullCls)(entity) : null;
  }

  async create(
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    const entity = this.repository.create(this.actionDtoToEntity(payload));
    await this.preCreate(entity);
    await this.emitHook(EHook.preCreate, entity);
    const created = await this.repository.save(entity);
    await this.postCreate(created);
    await this.emitHook(EHook.postCreate, created);
    return this.getTransformer(DtoTransformer.PlainCls)(created);
  }

  async createMany(
    payloads: InferActionDto<DtoAction.Create, ActionDto>[],
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    const entities = this.repository.create(
      payloads.map((payload) => this.actionDtoToEntity(payload)),
    );
    for (const entity of entities) {
      await this.preCreate(entity);
      await this.emitHook(EHook.preCreate, entity);
    }
    const created = await this.repository.save(entities);
    for (const entity of created) {
      await this.postCreate(entity);
      await this.emitHook(EHook.postCreate, entity);
    }
    return created.map(this.getTransformer(DtoTransformer.PlainCls));
  }

  async updateOne(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    options?: UpdateOneOptions,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    const entity = await this.findOneEntity(idOrOptions);
    if (entity) {
      const snapshot = { ...entity };
      const updates = this.actionDtoToEntity(payload);
      await this.preUpdate(snapshot, updates);
      await this.emitHook(EHook.preUpdate, {
        entity: snapshot,
        changes: updates,
      });
      Object.assign(entity, updates);
      const updated = await this.repository.save(entity);
      await this.postUpdate(updated);
      await this.emitHook(EHook.postUpdate, {
        entity: updated,
        previous: snapshot,
      });
      if (updated) {
        return this.getTransformer(DtoTransformer.PlainCls)(updated);
      } else {
        throw new NotFoundException(
          'Unable to execute updateOne() - No updates',
        );
      }
    }

    if (options?.upsert) {
      return await this.create(
        payload as unknown as InferActionDto<DtoAction.Create, ActionDto>,
      );
    } else {
      throw new NotFoundException('Unable to execute updateOne() - No updates');
    }
  }

  async updateMany(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    const entities = await this.findEntities(options);

    if (!entities.length) {
      return [];
    }

    const filter: RepositoryWhere<Entity> =
      options.where as RepositoryWhere<Entity>;
    const changes = this.actionDtoToEntity(payload);

    const snapshots = entities.map(
      (entity) =>
        Object.assign(
          Object.create(Object.getPrototypeOf(entity)),
          entity,
        ) as Entity,
    );

    await this.preUpdateMany(snapshots, filter, changes);
    await this.emitHook(EHook.preUpdateMany, {
      entities: snapshots,
      filter,
      changes,
    });

    for (let index = 0; index < entities.length; index++) {
      const snapshot = snapshots[index];
      await this.preUpdate(snapshot, changes);
      await this.emitHook(EHook.preUpdate, {
        entity: snapshot,
        changes,
      });
      Object.assign(entities[index], payload);
    }

    const updatedEntities = await this.repository.save(entities);

    for (let index = 0; index < updatedEntities.length; index++) {
      const updated = updatedEntities[index];
      const previous = snapshots[index];
      await this.postUpdate(updated);
      await this.emitHook(EHook.postUpdate, {
        entity: updated,
        previous,
      });
    }

    await this.postUpdateMany(updatedEntities, filter, changes);
    await this.emitHook(EHook.postUpdateMany, {
      entities: updatedEntities,
      previous: snapshots,
      filter,
      changes,
    });

    const toDto = this.getTransformer(DtoTransformer.PlainCls);
    return updatedEntities.map(toDto);
  }

  async findOneOrCreate(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Create, ActionDto>,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
    const existing = await this.findOneEntity(idOrOptions);
    if (existing) {
      return this.getTransformer(DtoTransformer.PlainCls)(existing);
    }

    return await this.create(payload);
  }

  async deleteMany(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
  ): Promise<DeleteResult> {
    const matches = await this.repository.find(options);

    if (matches.length === 0) {
      return { acknowledged: true, deletedCount: 0 };
    }

    const deletable = matches.filter((entity) => !this.isBuiltin(entity));

    if (!deletable.length) {
      return { acknowledged: true, deletedCount: 0 };
    }

    const filter: RepositoryWhere<Entity> =
      options.where as RepositoryWhere<Entity>;
    await this.preDelete(deletable, filter);
    await this.emitHook(EHook.preDelete, { entities: deletable, filter });
    await this.repository.remove(deletable);
    const result: DeleteResult = {
      acknowledged: true,
      deletedCount: deletable.length,
    };
    await this.postDelete(deletable, result);
    await this.emitHook(EHook.postDelete, { entities: deletable, result });
    return result;
  }

  async deleteOne(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<DeleteResult> {
    const entity = await this.findOneEntity(idOrOptions);

    if (!entity || this.isBuiltin(entity)) {
      return { acknowledged: true, deletedCount: 0 };
    }

    const filter: RepositoryWhere<Entity> =
      typeof idOrOptions === 'string'
        ? ({ id: idOrOptions } as FindOptionsWhere<Entity>)
        : (idOrOptions.where as RepositoryWhere<Entity>);

    await this.preDelete([entity], filter);
    await this.emitHook(EHook.preDelete, { entities: [entity], filter });
    await this.repository.remove(entity);
    const result: DeleteResult = {
      acknowledged: true,
      deletedCount: 1,
    };
    await this.postDelete([entity], result);
    await this.emitHook(EHook.postDelete, { entities: [entity], result });
    return result;
  }

  private isBuiltin(entity: Entity): boolean {
    return (entity as Record<string, unknown>).builtin === true;
  }

  protected getEventName(
    suffix: EHook,
  ): `hook:${IHookEntities}:${TNormalizedEvents}` {
    const entityName =
      camelCase(
        (this.repository.metadata.name ?? 'entity').replace(/OrmEntity$/, ''),
      ) || 'entity';
    return `hook:${entityName}:${suffix}` as `hook:${IHookEntities}:${TNormalizedEvents}`;
  }

  protected async emitHook(suffix: EHook, ...args: any[]): Promise<void> {
    if (!this.eventEmitter) return;
    const eventName = this.getEventName(suffix);
    const emitAsync = this.eventEmitter.emitAsync.bind(this.eventEmitter) as (
      event: string,
      ...emitArgs: any[]
    ) => Promise<unknown>;
    await emitAsync(eventName, ...args);
  }

  // Hooks available for child repositories

  protected async preCreate(
    _entity: DeepPartial<Entity> | Entity,
  ): Promise<void> {}

  protected async postCreate(_entity: Entity): Promise<void> {}

  protected async preUpdate(
    _current: Entity,
    _changes: DeepPartial<Entity>,
  ): Promise<void> {}

  protected async postUpdate(_updated: Entity): Promise<void> {}

  protected async preUpdateMany(
    _entities: Entity[],
    _filter: RepositoryWhere<Entity>,
    _changes: DeepPartial<Entity>,
  ): Promise<void> {}

  protected async postUpdateMany(
    _entities: Entity[],
    _filter: RepositoryWhere<Entity>,
    _changes: DeepPartial<Entity>,
  ): Promise<void> {}

  protected async preDelete(
    _entities: Entity[],
    _filter: RepositoryWhere<Entity>,
  ): Promise<void> {}

  protected async postDelete(
    _entities: Entity[],
    _result: DeleteResult,
  ): Promise<void> {}
}
