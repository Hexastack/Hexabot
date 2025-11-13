/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { LoggerService } from '@hexabot/logger';
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

import { BaseOrmEntity } from '@/database/entities/base.entity';
import { flatten } from '@/utils/helpers/flatten';

import {
  DtoAction,
  DtoActionConfig,
  DtoTransformer,
  DtoTransformerConfig,
  InferActionDto,
  InferTransformDto,
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
  Entity extends BaseOrmEntity,
  TransformerDto extends DtoTransformerConfig,
  ActionDto extends DtoActionConfig,
> implements EntitySubscriberInterface<Entity>
{
  private readonly dataSource: DataSource;

  protected constructor(
    protected readonly repository: Repository<Entity>,
    protected readonly populateRelations: string[] = [],
    protected readonly transformers: TransformerDto,
  ) {
    this.dataSource = repository.manager.connection;
    this.registerEntityManagerProvider();
    this.registerAsSubscriber();
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
    const created = await this.repository.save(entity);

    return this.getTransformer(DtoTransformer.PlainCls)(created);
  }

  async createMany(
    payloads: InferActionDto<DtoAction.Create, ActionDto>[],
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>[]> {
    const entities = this.repository.create(
      payloads.map((payload) => this.actionDtoToEntity(payload)),
    );
    const created = await this.repository.save(entities);

    return created.map(this.getTransformer(DtoTransformer.PlainCls));
  }

  async updateOne(
    idOrOptions: string | FindOneOptions<Entity>,
    payload: InferActionDto<DtoAction.Update, ActionDto>,
    options?: UpdateOneOptions,
  ): Promise<InferTransformDto<DtoTransformer.PlainCls, TransformerDto>> {
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
      const updated = await this.repository.save(entity);
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

    const changes = this.actionDtoToEntity(payload);

    for (let index = 0; index < entities.length; index++) {
      Object.assign(entities[index], changes);
    }

    const updatedEntities = await this.repository.save(entities);
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

  private registerEntityManagerProvider(): void {
    const target = this.repository.target;
    if (typeof target !== 'function') {
      return;
    }

    const entityConstructor = target as unknown as typeof BaseOrmEntity;
    if (typeof entityConstructor.registerEntityManagerProvider !== 'function') {
      return;
    }

    entityConstructor.registerEntityManagerProvider(
      () => this.repository.manager,
    );
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
    if (!this.eventEmitter) return;
    const eventName = this.getEventName(event.metadata, suffix);
    await this.eventEmitter.emitAsync(eventName, event);
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
  }

  async afterInsert(event: InsertEvent<Entity>): Promise<void> {
    await this.onAfterInsert(event);
    await this.emitHook(EHook.postCreate, event);
  }

  async beforeUpdate(event: UpdateEvent<Entity>): Promise<void> {
    await this.onBeforeUpdate(event);
    await this.emitHook(EHook.preUpdate, event);
  }

  async afterUpdate(event: UpdateEvent<Entity>): Promise<void> {
    await this.onAfterUpdate(event);
    await this.emitHook(EHook.postUpdate, event);
  }

  async beforeRemove(event: RemoveEvent<Entity>): Promise<void> {
    await this.onBeforeRemove(event);
    await this.emitHook(EHook.preDelete, event);
  }

  async afterRemove(event: RemoveEvent<Entity>): Promise<void> {
    await this.onAfterRemove(event);
    await this.emitHook(EHook.postDelete, event);
  }
}

type OrmLifecycleEvent<Entity extends BaseOrmEntity> =
  | InsertEvent<Entity>
  | UpdateEvent<Entity>
  | RemoveEvent<Entity>;
