/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Inject } from '@nestjs/common';
import {
  EventEmitter2,
  IHookEntities,
  TNormalizedEvents,
} from '@nestjs/event-emitter';
import { ClassTransformOptions, plainToClass } from 'class-transformer';
import {
  Document,
  FilterQuery,
  FlattenMaps,
  HydratedDocument,
  Model,
  ProjectionType,
  Query,
  QueryOptions,
  SortOrder,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
} from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import { TFilterQuery } from '@/utils/types/filter.types';

import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';
import { DtoAction, DtoConfig, DtoInfer } from '../types/dto.types';

import { BaseSchema } from './base-schema';
import { LifecycleHookManager } from './lifecycle-hook-manager';

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

// ! ------------------------------------ Note --------------------------------------------
// Methods like `update()`, `updateOne()`, `updateMany()`, `findOneAndUpdate()`,
// `findByIdAndUpdate()`, `findOneAndReplace()`, `findOneAndDelete()`, and `findByIdAndDelete()`
// do not trigger Mongoose validation hooks by default. This is because these methods do not
// return Mongoose Documents but plain JavaScript objects (POJOs), which do not have Mongoose
// instance methods like `validate()` attached.
//
// Be cautious when using the `.lean()` function as well. It returns POJOs instead of Mongoose
// Documents, so methods and hooks like `validate()` will not be available when working with
// the returned data. If you need validation, ensure that you're working with a Mongoose Document
// or explicitly use `runValidators: true` in the options for update operations.

export abstract class BaseRepository<
  T extends FlattenMaps<unknown>,
  P extends string = never,
  TFull extends Omit<T, P> = never,
  Dto extends DtoConfig = object,
  U extends Omit<T, keyof BaseSchema> = Omit<T, keyof BaseSchema>,
  D = Document<T>,
> {
  private readonly transformOpts = { excludePrefixes: ['_', 'password'] };

  private readonly leanOpts = { virtuals: true, defaults: true, getters: true };

  @Inject(EventEmitter2)
  readonly eventEmitter: EventEmitter2;

  @Inject(LoggerService)
  readonly logger: LoggerService;

  constructor(
    readonly model: Model<T>,
    private readonly cls: new () => T,
    protected readonly populate: P[] = [],
    protected readonly clsPopulate?: new () => TFull,
  ) {
    this.registerLifeCycleHooks();
  }

  canPopulate(populate: string[]): boolean {
    return populate.some((p) => this.populate.includes(p as P));
  }

  getEventName(suffix: EHook) {
    const entity = this.cls.name.toLocaleLowerCase();
    return `hook:${entity}:${suffix}` as `hook:${IHookEntities}:${TNormalizedEvents}`;
  }

  private registerLifeCycleHooks(): void {
    const repository = this;
    const hooks = LifecycleHookManager.getHooks(this.cls.name);
    if (!hooks) {
      // eslint-disable-next-line no-console
      console.warn(
        `LifeCycleHooks has not been registered for ${this.cls.name}`,
      );
      return;
    }

    hooks.validate.pre.execute(async function () {
      const doc = this as HydratedDocument<T>;
      await repository.preCreateValidate(doc);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.preCreateValidate),
        doc,
      );
    });

    hooks.validate.post.execute(async function (created: HydratedDocument<T>) {
      await repository.postCreateValidate(created);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.postCreateValidate),
        created,
      );
    });

    hooks.save.pre.execute(async function () {
      const doc = this as HydratedDocument<T>;
      await repository.preCreate(doc);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.preCreate),
        doc,
      );
    });

    hooks.save.post.execute(async function (created: HydratedDocument<T>) {
      await repository.postCreate(created);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.postCreate),
        created,
      );
    });

    hooks.deleteOne.pre.execute(async function () {
      const query = this as Query<DeleteResult, D, unknown, T, 'deleteOne'>;
      const criteria = query.getQuery();
      await repository.preDelete(query, criteria);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.preDelete),
        query,
        criteria,
      );
    });

    hooks?.deleteOne.post.execute(async function (result: DeleteResult) {
      const query = this as Query<DeleteResult, D, unknown, T, 'deleteOne'>;
      await repository.postDelete(query, result);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.postDelete),
        query,
        result,
      );
    });

    hooks.deleteMany.pre.execute(async function () {
      const query = this as Query<DeleteResult, D, unknown, T, 'deleteMany'>;
      const criteria = query.getQuery();
      await repository.preDelete(query, criteria);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.preDelete),
        query,
        criteria,
      );
    });

    hooks.deleteMany.post.execute(async function (result: DeleteResult) {
      const query = this as Query<DeleteResult, D, unknown, T, 'deleteMany'>;
      await repository.postDelete(query, result);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.postDelete),
        query,
        result,
      );
    });

    hooks.findOneAndUpdate.pre.execute(async function () {
      const query = this as Query<D, D, unknown, T, 'findOneAndUpdate'>;
      const criteria = query.getFilter();
      const updates = query.getUpdate();
      if (!updates) {
        throw new Error('Unable to run findOneAndUpdate pre hook');
      }
      await repository.preUpdate(query, criteria, updates);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.preUpdate),
        criteria,
        updates?.['$set'],
      );
    });

    hooks.updateMany.pre.execute(async function () {
      const query = this as Query<D, D, unknown, T, 'updateMany'>;
      const criteria = query.getFilter();
      const updates = query.getUpdate();
      if (!updates) {
        throw new Error('Unable to execute updateMany() pre-hook');
      }
      await repository.preUpdateMany(query, criteria, updates);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.preUpdateMany),
        criteria,
        updates?.['$set'],
      );
    });

    hooks.updateMany.post.execute(async function (updated: any) {
      const query = this as Query<D, D, unknown, T, 'updateMany'>;
      await repository.postUpdateMany(query, updated);
      await repository.eventEmitter.emitAsync(
        repository.getEventName(EHook.postUpdateMany),
        updated,
      );
    });

    hooks.findOneAndUpdate.post.execute(async function (
      updated: HydratedDocument<T>,
    ) {
      if (updated) {
        const query = this as Query<D, D, unknown, T, 'findOneAndUpdate'>;
        await repository.postUpdate(
          query,
          plainToClass(repository.cls, updated, repository.transformOpts),
        );
        await repository.eventEmitter.emitAsync(
          repository.getEventName(EHook.postUpdate),
          updated,
        );
      }
    });
  }

  protected async execute<R extends Omit<T, P>>(
    query: Query<T[], T>,
    cls: new () => R,
  ): Promise<R[]> {
    const resultSet = await query.lean(this.leanOpts).exec();
    return resultSet.map((doc) => plainToClass(cls, doc, this.transformOpts));
  }

  protected async executeOne<R extends Omit<T, P>>(
    query: Query<T | null, T>,
    cls: new () => R,
    options?: ClassTransformOptions,
  ): Promise<R | null> {
    const doc = await query.lean(this.leanOpts).exec();
    return plainToClass(cls, doc, options ?? this.transformOpts);
  }

  protected findOneQuery(
    criteria: string | TFilterQuery<T>,
    projection?: ProjectionType<T>,
  ): Query<T | null, T, object, T, 'findOne', object> {
    if (!criteria) {
      // An empty criteria would return the first document that it finds
      throw new Error('findOneQuery() should not have an empty criteria');
    }

    return typeof criteria === 'string'
      ? this.model.findById<HydratedDocument<T>>(criteria, projection)
      : this.model.findOne<HydratedDocument<T>>(criteria, projection);
  }

  async findOne(
    criteria: string | TFilterQuery<T>,
    options?: ClassTransformOptions,
    projection?: ProjectionType<T>,
  ) {
    if (!criteria) {
      // @TODO : Issue a warning ?
      return null;
    }

    const query = this.findOneQuery(criteria, projection);
    return await this.executeOne(query, this.cls, options);
  }

  async findOneAndPopulate(
    criteria: string | TFilterQuery<T>,
    projection?: ProjectionType<T>,
  ): Promise<TFull | null> {
    this.ensureCanPopulate();
    const query = this.findOneQuery(criteria, projection).populate(
      this.populate,
    );
    return await this.executeOne(query, this.clsPopulate!);
  }

  protected findQuery(
    filter: TFilterQuery<T>,
    pageQuery?: PageQueryDto<T>,
    projection?: ProjectionType<T>,
  ): Query<T[], T, object, T, 'find', object>;

  /**
   * @deprecated
   */
  protected findQuery(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T>,
    projection?: ProjectionType<T>,
  ): Query<T[], T, object, T, 'find', object>;

  protected findQuery(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T> | PageQueryDto<T>,
    projection?: ProjectionType<T>,
  ): Query<T[], T, object, T, 'find', object> {
    if (Array.isArray(pageQuery)) {
      const query = this.model.find<T>(filter, projection);
      return query.sort([pageQuery] as [string, SortOrder][]);
    }

    const {
      skip = 0,
      limit = 0,
      sort = ['createdAt', 'asc'],
    } = pageQuery || {};
    const query = this.model.find<T>(filter, projection);
    return query
      .skip(skip)
      .limit(limit)
      .sort([sort] as [string, SortOrder][]);
  }

  async find(
    filter: TFilterQuery<T>,
    pageQuery?: PageQueryDto<T>,
    projection?: ProjectionType<T>,
  ): Promise<T[]>;

  /**
   * @deprecated
   */
  async find(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T>,
    projection?: ProjectionType<T>,
  ): Promise<T[]>;

  async find(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T> | PageQueryDto<T>,
    projection?: ProjectionType<T>,
  ): Promise<T[]> {
    if (Array.isArray(pageQuery)) {
      const query = this.findQuery(filter, pageQuery, projection);
      return await this.execute(query, this.cls);
    }

    const query = this.findQuery(filter, pageQuery, projection);
    return await this.execute(query, this.cls);
  }

  private ensureCanPopulate(): void {
    if (!this.populate || !this.clsPopulate) {
      throw new Error('Cannot populate query');
    }
  }

  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: PageQueryDto<T>,
    projection?: ProjectionType<T>,
  ): Promise<TFull[]>;

  /**
   * @deprecated
   */
  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T>,
    projection?: ProjectionType<T>,
  ): Promise<TFull[]>;

  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T> | PageQueryDto<T>,
    projection?: ProjectionType<T>,
  ): Promise<TFull[]> {
    this.ensureCanPopulate();
    if (Array.isArray(pageQuery)) {
      const query = this.findQuery(filters, pageQuery, projection).populate(
        this.populate,
      );
      return await this.execute(query, this.clsPopulate!);
    }

    const query = this.findQuery(filters, pageQuery, projection).populate(
      this.populate,
    );
    return await this.execute(query, this.clsPopulate!);
  }

  protected findAllQuery(
    sort?: QuerySortDto<T>,
  ): Query<T[], T, object, T, 'find', object> {
    return this.findQuery({}, { limit: 0, skip: 0, sort });
  }

  async findAll(sort?: QuerySortDto<T>): Promise<T[]> {
    return await this.find({}, { limit: 0, skip: 0, sort });
  }

  async findAllAndPopulate(sort?: QuerySortDto<T>): Promise<TFull[]> {
    this.ensureCanPopulate();
    const query = this.findAllQuery(sort).populate(this.populate);
    return await this.execute(query, this.clsPopulate!);
  }

  /**
   * @deprecated
   */
  protected findPageQuery(
    filters: TFilterQuery<T>,
    { skip = 0, limit = 0, sort }: PageQueryDto<T>,
  ): Query<T[], T, object, T, 'find', object> {
    return this.findQuery(filters)
      .skip(skip)
      .limit(limit)
      .sort([sort] as [string, SortOrder][]);
  }

  /**
   * @deprecated
   */
  async findPage(
    filters: TFilterQuery<T>,
    pageQuery: PageQueryDto<T>,
  ): Promise<T[]> {
    const query = this.findPageQuery(filters, pageQuery);
    return await this.execute(query, this.cls);
  }

  /**
   * @deprecated
   */
  async findPageAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery: PageQueryDto<T>,
  ): Promise<TFull[]> {
    this.ensureCanPopulate();
    const query = this.findPageQuery(filters, pageQuery).populate(
      this.populate,
    );
    return await this.execute(query, this.clsPopulate!);
  }

  async countAll(): Promise<number> {
    return await this.model.estimatedDocumentCount().exec();
  }

  async count(criteria?: TFilterQuery<T>): Promise<number> {
    return await this.model.countDocuments(criteria).exec();
  }

  async create(dto: DtoInfer<DtoAction.Create, Dto, U>): Promise<T> {
    const doc = await this.model.create(dto);

    return plainToClass(
      this.cls,
      doc.toObject(this.leanOpts),
      this.transformOpts,
    );
  }

  async createMany(
    dtoArray: DtoInfer<DtoAction.Create, Dto, U>[],
  ): Promise<T[]> {
    const docs = await this.model.create(dtoArray);

    return docs.map((doc) =>
      plainToClass(this.cls, doc.toObject(this.leanOpts), this.transformOpts),
    );
  }

  async updateOne<D extends Partial<U>>(
    criteria: string | TFilterQuery<T>,
    dto: UpdateQuery<DtoInfer<DtoAction.Update, Dto, D>>,
    options: QueryOptions<D> | null = {
      new: true,
    },
  ): Promise<T> {
    const query = this.model.findOneAndUpdate<T>(
      {
        ...(typeof criteria === 'string' ? { _id: criteria } : criteria),
      },
      {
        $set: dto,
      },
      options,
    );
    const filterCriteria = query.getFilter();
    const queryUpdates = query.getUpdate();

    if (!queryUpdates) {
      throw new Error('Unable to execute updateOne() - No updates');
    }

    await this.preUpdateValidate(filterCriteria, queryUpdates);
    await this.eventEmitter.emitAsync(
      this.getEventName(EHook.preUpdateValidate),
      filterCriteria,
      queryUpdates,
    );

    await this.postUpdateValidate(filterCriteria, queryUpdates);
    await this.eventEmitter.emitAsync(
      this.getEventName(EHook.postUpdateValidate),
      filterCriteria,
      queryUpdates,
    );
    const result = await this.executeOne(query, this.cls);

    if (!result) {
      const errorMessage = `Unable to update ${this.cls.name} with ${typeof criteria === 'string' ? 'ID' : 'criteria'} ${JSON.stringify(criteria)}`;
      throw new Error(errorMessage);
    }

    return result;
  }

  async updateMany<D extends Partial<U>>(
    filter: TFilterQuery<T>,
    dto: UpdateQuery<D>,
  ): Promise<UpdateWriteOpResult> {
    return await this.model.updateMany<T>(filter, {
      $set: dto,
    });
  }

  async deleteOne(criteria: string | TFilterQuery<T>): Promise<DeleteResult> {
    return await this.model
      .deleteOne(typeof criteria === 'string' ? { _id: criteria } : criteria)
      .exec();
  }

  async deleteMany(criteria: TFilterQuery<T>): Promise<DeleteResult> {
    return await this.model.deleteMany(criteria);
  }

  async preCreateValidate(
    _doc: HydratedDocument<T>,
    _filterCriteria?: FilterQuery<T>,
    _updates?: UpdateWithAggregationPipeline | UpdateQuery<T>,
  ): Promise<void> {
    // Nothing ...
  }

  async postCreateValidate(_validated: HydratedDocument<T>): Promise<void> {
    // Nothing ...
  }

  async preUpdateValidate(
    _filterCriteria: FilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<T>,
  ): Promise<void> {
    // Nothing ...
  }

  async postUpdateValidate(
    _filterCriteria: FilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<T>,
  ): Promise<void> {
    // Nothing ...
  }

  async preCreate(_doc: HydratedDocument<T>): Promise<void> {
    // Nothing ...
  }

  async postCreate(_created: HydratedDocument<T>): Promise<void> {
    // Nothing ...
  }

  async preUpdate(
    _query: Query<D, D, unknown, T, 'findOneAndUpdate'>,
    _criteria: TFilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<D>,
  ): Promise<void> {
    // Nothing ...
  }

  async preUpdateMany(
    _query: Query<D, D, unknown, T, 'updateMany'>,
    _criteria: TFilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<D>,
  ): Promise<void> {
    // Nothing ...
  }

  async postUpdateMany(
    _query: Query<D, D, unknown, T, 'updateMany'>,
    _updated: any,
  ): Promise<void> {
    // Nothing ...
  }

  async postUpdate(
    _query: Query<D, D, unknown, T, 'findOneAndUpdate'>,
    _updated: T,
  ): Promise<void> {
    // Nothing ...
  }

  async preDelete(
    _query: Query<DeleteResult, D, unknown, T, 'deleteOne' | 'deleteMany'>,
    _criteria: TFilterQuery<T>,
  ): Promise<void> {
    // Nothing ...
  }

  async postDelete(
    _query: Query<DeleteResult, D, unknown, T, 'deleteOne' | 'deleteMany'>,
    _result: DeleteResult,
  ): Promise<void> {
    // Nothing ...
  }
}
