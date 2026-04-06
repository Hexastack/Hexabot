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
import set from 'lodash/set';
import {
  DataSource,
  DeepPartial,
  EntityMetadata,
  EntitySubscriberInterface,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  InsertEvent,
  RemoveEvent,
  Repository,
  UpdateEvent,
} from 'typeorm';

import {
  invokeOrmHooks,
  OrmHookName,
} from '@/database/decorators/orm-event-hooks.decorator';
import { BaseOrmEntity } from '@/database/entities/base.entity';
import { LoggerService } from '@/logger/logger.service';
import { flatten } from '@/utils/helpers/flatten';

import {
  DtoAction,
  EntityDto,
  InferCreateDto,
  InferEntityDto,
  InferFull,
  InferPlain,
  InferUpdateDto,
} from '../types/dto.types';

export type DeleteResult = {
  acknowledged: boolean;
  deletedCount: number;
};

export enum EHook {
  preCreateValidate = 'preCreateValidate',
  preCreate = 'preCreate',
  preUpdateValidate = 'preUpdateValidate',
  preUpdate = 'preUpdate',
  preUpdateMany = 'preUpdateMany',
  preDelete = 'preDelete',
  postCreateValidate = 'postCreateValidate',
  postCreate = 'postCreate',
  postUpdateValidate = 'postUpdateValidate',
  postUpdate = 'postUpdate',
  postUpdateMany = 'postUpdateMany',
  postDelete = 'postDelete',
}

export type UpdateOneOptions = {
  upsert?: boolean;
  shouldFlatten?: boolean;
};

export type FindAllOptions<EntityType> = Omit<
  FindManyOptions<EntityType>,
  'where'
> & {
  where?: never;
};

export abstract class BaseOrmRepository<
  Entity extends BaseOrmEntity<EntityDto<Entity>>,
> implements EntitySubscriberInterface<Entity>
{
  private readonly dataSource: DataSource;

  protected constructor(
    protected readonly repository: Repository<Entity>,
    protected readonly populateRelations: string[] = [],
  ) {
    this.dataSource = repository.manager.connection;
    this.registerAsSubscriber();
  }

  private async invokeEntityHooks(
    hook: OrmHookName,
    event: OrmLifecycleEvent<Entity>,
  ): Promise<void> {
    await invokeOrmHooks(event.entity, hook, event);
  }

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

  getEventEmitter(): EventEmitter2 {
    return this.eventEmitter;
  }

  @Inject(EventEmitter2)
  protected readonly eventEmitter: EventEmitter2;

  @Inject(LoggerService)
  protected readonly logger: LoggerService;

  public actionDtoToEntity<Action extends DtoAction>(
    data: InferEntityDto<Action, Entity>,
  ): DeepPartial<Entity> {
    const e = plainToInstance(
      this.repository.target as new (...args: any[]) => Entity,
      instanceToPlain(data),
    );

    return Object.assign(e) as DeepPartial<Entity>;
  }

  async findAll(
    options: FindAllOptions<Entity> = {} as FindAllOptions<Entity>,
  ): Promise<InferPlain<Entity>[]> {
    const entities = await this.findAllEntities(options);

    return entities.map((e) => e.toPlainCls());
  }

  private async findAllEntities(
    options: FindAllOptions<Entity> = {} as FindAllOptions<Entity>,
  ): Promise<Entity[]> {
    return await this.repository.find(options as FindManyOptions<Entity>);
  }

  async findAllAndPopulate(
    options: FindAllOptions<Entity> = {} as FindAllOptions<Entity>,
  ): Promise<InferFull<Entity>[]> {
    const populatedEntities = await this.repository.find(
      this.withPopulateRelations(options as FindManyOptions<Entity>, true),
    );

    return populatedEntities.map((e) => e.toFullCls());
  }

  async find(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
  ): Promise<InferPlain<Entity>[]> {
    const entities = await this.findEntities(options);

    return entities.map((e) => e.toPlainCls());
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
  ): Promise<InferFull<Entity>[]> {
    const entities = await this.findEntities(options, true);

    return entities.map((e) => e.toFullCls());
  }

  async count(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
  ): Promise<number> {
    return await this.repository.count(options);
  }

  async findOne(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<InferPlain<Entity> | null> {
    const entity = await this.findOneEntity(idOrOptions);

    return entity ? entity.toPlainCls() : null;
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
  ): Promise<InferFull<Entity> | null> {
    const entity = await this.findOneEntity(idOrOptions, true);

    return entity ? entity.toFullCls() : null;
  }

  async create(payload: InferCreateDto<Entity>): Promise<InferPlain<Entity>> {
    const entity = this.repository.create(this.actionDtoToEntity(payload));
    const created = await this.repository.save(entity);

    return created.toPlainCls();
  }

  async createMany(
    payloads: InferCreateDto<Entity>[],
  ): Promise<InferPlain<Entity>[]> {
    const entities = this.repository.create(
      payloads.map((payload) => this.actionDtoToEntity(payload)),
    );
    const created = await this.repository.save(entities);

    return created.map((e) => e.toPlainCls());
  }

  async updateOne(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferUpdateDto<Entity>,
    options?: UpdateOneOptions,
  ): Promise<InferPlain<Entity>> {
    const entity = await this.findOneEntity(idOrOptions);
    if (entity) {
      const updates = this.actionDtoToEntity(payload);
      if (options?.shouldFlatten && updates && typeof updates === 'object') {
        const flattenedUpdates = flatten(
          updates as Record<string, unknown>,
        ) as Record<string, unknown>;
        const target = entity as Record<string, unknown>;
        for (const [path, value] of Object.entries(flattenedUpdates)) {
          set(target, path, value);
        }
      } else {
        Object.assign(entity, updates);
      }
      // Read all fields from the update data.
      const entries = Object.entries(payload ?? {});
      // Find relation keys that are many-to-many.
      const manyToManyKeys = this.repository.metadata.relations
        .filter((relation) => relation.isManyToMany)
        .map((relation) => relation.propertyName);
      // Check if update data has only many-to-many list fields.
      const hasOnlyManyToManyProperties =
        entries.length > 0 &&
        entries.every(
          ([key, val]) => manyToManyKeys.includes(key) && Array.isArray(val),
        );

      // If only many-to-many fields changed, set update time to trigger afterUpdate event
      if (hasOnlyManyToManyProperties) {
        entity.updatedAt = new Date();
      }

      const updated = await this.repository.save(entity);
      if (updated) {
        return updated.toPlainCls();
      } else {
        throw new NotFoundException(
          'Unable to execute updateOne() - No updates',
        );
      }
    }

    if (options?.upsert) {
      return await this.create(payload as unknown as InferCreateDto<Entity>);
    } else {
      throw new NotFoundException('Unable to execute updateOne() - No updates');
    }
  }

  async updateMany(
    options: FindManyOptions<Entity> = {} as FindManyOptions<Entity>,
    payload: InferUpdateDto<Entity>,
  ): Promise<InferPlain<Entity>[]> {
    const entities = await this.findEntities(options);

    if (!entities.length) {
      return [];
    }

    const changes = this.actionDtoToEntity(payload);

    for (let index = 0; index < entities.length; index++) {
      Object.assign(entities[index], changes);
    }

    const updatedEntities = await this.repository.save(entities);

    return updatedEntities.map((e) => e.toPlainCls());
  }

  async findOneOrCreate(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferCreateDto<Entity>,
  ): Promise<InferPlain<Entity>> {
    const existing = await this.findOneEntity(idOrOptions);
    if (existing) {
      return existing.toPlainCls();
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

    await this.repository.remove(deletable);
    const result: DeleteResult = {
      acknowledged: true,
      deletedCount: deletable.length,
    };

    return result;
  }

  async deleteOne(
    idOrOptions: string | FindOneOptions<Entity>,
  ): Promise<DeleteResult> {
    const entity = await this.findOneEntity(idOrOptions);

    if (!entity || this.isBuiltin(entity)) {
      return { acknowledged: true, deletedCount: 0 };
    }

    await this.repository.remove(entity);
    const result: DeleteResult = {
      acknowledged: true,
      deletedCount: 1,
    };

    return result;
  }

  private isBuiltin(entity: Entity): boolean {
    return (entity as Record<string, unknown>).builtin === true;
  }

  listenTo() {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return this.repository.target as Function;
  }

  private registerAsSubscriber(): void {
    const alreadyRegistered = this.dataSource.subscribers.some(
      (subscriber) => subscriber === this,
    );
    if (!alreadyRegistered) {
      this.dataSource.subscribers.push(this as EntitySubscriberInterface<any>);
    }
  }

  protected getEventName(
    metadata: EntityMetadata,
    suffix: EHook,
  ): `hook:${IHookEntities}:${TNormalizedEvents}` {
    const entityName =
      camelCase((metadata.name ?? 'entity').replace(/OrmEntity$/, '')) ||
      'entity';

    return `hook:${entityName}:${suffix}` as `hook:${IHookEntities}:${TNormalizedEvents}`;
  }

  protected async emitHook(
    suffix: EHook,
    event: OrmLifecycleEvent<Entity>,
  ): Promise<void> {
    this.ensureEntityIdOnEventEntity(event);
    if (!this.eventEmitter) return;
    const eventName = this.getEventName(event.metadata, suffix);
    await this.eventEmitter.emitAsync(eventName, event);
  }

  private ensureEntityIdOnEventEntity(event: OrmLifecycleEvent<Entity>): void {
    const eventEntity = event.entity as Record<string, unknown> | undefined;
    if (!eventEntity || typeof eventEntity !== 'object') {
      return;
    }

    if (typeof eventEntity.id === 'string' && eventEntity.id) {
      return;
    }

    const resolvedId = this.resolveEventEntityId(event);
    if (resolvedId) {
      eventEntity.id = resolvedId;
    }
  }

  private resolveEventEntityId(
    event: OrmLifecycleEvent<Entity>,
  ): string | null {
    const candidates: unknown[] = [];

    if ('entityId' in event) {
      candidates.push(event.entityId);
    }

    if ('databaseEntity' in event && event.databaseEntity) {
      candidates.push((event.databaseEntity as Record<string, unknown>).id);
    }

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate) {
        return candidate;
      }

      if (candidate && typeof candidate === 'object') {
        const nestedId = (candidate as Record<string, unknown>).id;
        if (typeof nestedId === 'string' && nestedId) {
          return nestedId;
        }
      }
    }

    return null;
  }

  protected async onBeforeInsert(_event: InsertEvent<Entity>): Promise<void> {}

  protected async onAfterInsert(_event: InsertEvent<Entity>): Promise<void> {}

  protected async onBeforeUpdate(_event: UpdateEvent<Entity>): Promise<void> {}

  protected async onAfterUpdate(_event: UpdateEvent<Entity>): Promise<void> {}

  protected async onBeforeRemove(_event: RemoveEvent<Entity>): Promise<void> {}

  protected async onAfterRemove(_event: RemoveEvent<Entity>): Promise<void> {}

  async beforeInsert(event: InsertEvent<Entity>): Promise<void> {
    await this.onBeforeInsert(event);
    await this.emitHook(EHook.preCreate, event);
    await this.invokeEntityHooks('beforeInsert', event);
  }

  async afterInsert(event: InsertEvent<Entity>): Promise<void> {
    await this.onAfterInsert(event);
    await this.emitHook(EHook.postCreate, event);
    await this.invokeEntityHooks('afterInsert', event);
  }

  async beforeUpdate(event: UpdateEvent<Entity>): Promise<void> {
    await this.onBeforeUpdate(event);
    await this.emitHook(EHook.preUpdate, event);
    await this.invokeEntityHooks('beforeUpdate', event);
  }

  async afterUpdate(event: UpdateEvent<Entity>): Promise<void> {
    await this.onAfterUpdate(event);
    await this.emitHook(EHook.postUpdate, event);
    await this.invokeEntityHooks('afterUpdate', event);
  }

  async beforeRemove(event: RemoveEvent<Entity>): Promise<void> {
    await this.onBeforeRemove(event);
    await this.emitHook(EHook.preDelete, event);
    await this.invokeEntityHooks('beforeRemove', event);
  }

  async afterRemove(event: RemoveEvent<Entity>): Promise<void> {
    await this.onAfterRemove(event);
    await this.emitHook(EHook.postDelete, event);
    await this.invokeEntityHooks('afterRemove', event);
  }
}

type OrmLifecycleEvent<Entity extends BaseOrmEntity> =
  | InsertEvent<Entity>
  | UpdateEvent<Entity>
  | RemoveEvent<Entity>;
