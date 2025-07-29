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
  PipelineStage,
  Query,
  SortOrder,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  UpdateWriteOpResult,
} from 'mongoose';

import { LoggerService } from '@/logger/logger.service';
import {
  TFilterQuery,
  TFlattenOption,
  THydratedDocument,
  TProjectionType,
  TQueryOptions,
} from '@/utils/types/filter.types';

import { flatten } from '../helpers/flatten';
import { camelCase } from '../helpers/misc';
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
  protected readonly transformOpts = { excludePrefixes: ['_', 'password'] };

  protected readonly leanOpts = {
    virtuals: true,
    defaults: true,
    getters: true,
  };

  @Inject(EventEmitter2)
  readonly eventEmitter: EventEmitter2;

  @Inject(LoggerService)
  readonly logger: LoggerService;

  constructor(
    readonly model: Model<T>,
    private readonly cls: new () => T,
    protected readonly populatePaths: P[] = [],
    protected readonly clsPopulate?: new () => TFull,
  ) {
    this.registerLifeCycleHooks();
  }

  /**
   * Determine whether at least one of the requested populate paths
   * is supported by the repository.
   *
   * @param populate  Array of path strings supplied by the caller.
   * @returns `true` if any item appears in `this.populatePaths`, else `false`.
   */
  canPopulate(populate: string[]): boolean {
    return populate.some((p) => this.populatePaths.includes(p as P));
  }

  /**
   * Build the canonical event name used by the repository’s event-bus hooks.
   *
   * Format: `hook:<entity>:<suffix>`
   * where `<entity>` is the lower-cased class name and `<suffix>` is an
   * `EHook` value such as `"preCreate"` or `"postUpdate"`.
   *
   * @param suffix  Lifecycle-hook suffix.
   * @returns A type-safe event name string.
   */
  getEventName(suffix: EHook) {
    const entity = camelCase(this.cls.name);
    return `hook:${entity}:${suffix}` as `hook:${IHookEntities}:${TNormalizedEvents}`;
  }

  /**
   * Wire all Mongoose lifecycle hooks to the repository’s overridable
   * `pre-/post-*` methods **and** to the domain event bus.
   *
   * For the current repository (`this.cls.name`) the method:
   * 1. Retrieves the hook definitions from `LifecycleHookManager`.
   * 2. Registers handlers for:
   *    • `validate.pre / validate.post` → `preCreateValidate` / `postCreateValidate`
   *    • `save.pre / save.post`         → `preCreate`         / `postCreate`
   *    • `deleteOne.*  deleteMany.*`    → `preDelete`         / `postDelete`
   *    • `findOneAndUpdate.*`           → `preUpdate`         / `postUpdate`
   *    • `updateMany.*`                 → `preUpdateMany`     / `postUpdateMany`
   * 3. Emits the corresponding domain events (`EHook.*`) via `eventEmitter`
   *    after each repository callback.
   *
   * If no hooks are registered for the current class, a console warning is
   * issued and the method exits gracefully.
   */
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

  /**
   * Execute a `find`-style query, convert each lean result to `cls`, and return
   * the transformed list.
   *
   * - The query is run with `lean(this.leanOpts)` for performance.
   * - Each plain object is passed through `plainToClass` using
   *   `this.transformOpts`.
   *
   * @template R  Result type – typically the populated or base DTO class.
   * @param query Mongoose query returning an array of documents.
   * @param cls   Constructor used by `plainToClass` for transformation.
   * @returns Promise resolving to an array of class instances.
   */
  protected async execute<R extends Omit<T, P>>(
    query: Query<T[], T>,
    cls: new () => R,
  ): Promise<R[]> {
    const resultSet = await query.lean(this.leanOpts).exec();
    return resultSet.map((doc) => plainToClass(cls, doc, this.transformOpts));
  }

  /**
   * Execute a single-document query, convert the result to `cls`,
   * and return it (or `null`).
   *
   * - Uses `lean(this.leanOpts)` for performance.
   * - Falls back to `this.transformOpts` when `options` is not provided.
   *
   * @template R  Result type – typically the populated or base DTO class.
   * @param query   Mongoose query expected to return one document.
   * @param cls     Constructor used by `plainToClass`.
   * @param options Optional `ClassTransformOptions` overriding defaults.
   * @returns Promise resolving to a class instance or `null`.
   */
  protected async executeOne<R extends Omit<T, P>>(
    query: Query<T | null, T>,
    cls: new () => R,
    options?: ClassTransformOptions,
  ): Promise<R | null> {
    const doc = await query.lean(this.leanOpts).exec();
    return plainToClass(cls, doc, options ?? this.transformOpts);
  }

  /**
   * Build a `findOne`/`findById` query.
   *
   * - `criteria` may be an `_id` string or any Mongo filter;
   *   an empty / falsy value is **not allowed** (throws).
   * - Optional `projection` is forwarded unchanged.
   *
   * @param criteria   Document `_id` **or** Mongo filter.
   * @param projection Optional Mongo projection.
   * @throws Error when `criteria` is empty.
   * @returns Un-executed Mongoose query.
   */
  protected findOneQuery(
    criteria: string | TFilterQuery<T>,
    projection?: TProjectionType<T>,
  ): Query<T | null, T, object, T, 'findOne', object> {
    if (!criteria) {
      // An empty criteria would return the first document that it finds
      throw new Error('findOneQuery() should not have an empty criteria');
    }

    return typeof criteria === 'string'
      ? this.model.findById<HydratedDocument<T>>(criteria, projection)
      : this.model.findOne<HydratedDocument<T>>(criteria, projection);
  }

  /**
   * Retrieve a single document and convert it to `this.cls`.
   *
   * - Returns `null` immediately when `criteria` is falsy.
   * - Optional `options` are passed to `plainToClass`.
   * - Optional `projection` limits returned fields.
   *
   * @param criteria   Document `_id` **or** Mongo filter.
   * @param options    Class-transform options.
   * @param projection Optional Mongo projection.
   * @returns Promise resolving to the found entity or `null`.
   */
  async findOne(
    criteria: string | TFilterQuery<T>,
    options?: ClassTransformOptions,
    projection?: TProjectionType<T>,
  ): Promise<T | null> {
    if (!criteria) {
      // @TODO : Issue a warning ?
      return null;
    }

    const query = this.findOneQuery(criteria, projection);
    return await this.executeOne(query, this.cls, options);
  }

  /**
   * Retrieve a single document with all `populatePaths` relations resolved.
   *
   * - Throws if population is not configured.
   * - Returns `null` when nothing matches `criteria`.
   *
   * @param criteria   Document `_id` **or** Mongo filter.
   * @param projection Optional Mongo projection.
   * @returns Promise resolving to the populated entity or `null`.
   */
  async findOneAndPopulate(
    criteria: string | TFilterQuery<T>,
    projection?: TProjectionType<T>,
  ): Promise<TFull | null> {
    this.ensureCanPopulate();
    const query = this.findOneQuery(criteria, projection).populate(
      this.populatePaths,
    );
    return await this.executeOne(query, this.clsPopulate!);
  }

  protected findQuery(
    filter: TFilterQuery<T>,
    pageQuery?: PageQueryDto<T>,
    projection?: TProjectionType<T>,
  ): Query<T[], T, object, T, 'find', object>;

  /**
   * @deprecated
   */
  protected findQuery(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T>,
    projection?: TProjectionType<T>,
  ): Query<T[], T, object, T, 'find', object>;

  /**
   * Build an un-executed `find` query with optional pagination, sorting,
   * and projection.
   *
   * The returned query can be further chained or passed to `execute`.
   *
   * @param filter      Mongo selector for the documents.
   * @param pageQuery   Sort tuple **or** paging object (optional).
   * @param projection  Mongo projection (optional).
   * @returns A Mongoose `find` query with `skip`, `limit`, and `sort` applied.
   */
  protected findQuery(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T> | PageQueryDto<T>,
    projection?: TProjectionType<T>,
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
    projection?: TProjectionType<T>,
  ): Promise<T[]>;

  /**
   * @deprecated
   */
  async find(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<T[]>;

  /**
   * Find documents matching `filter`.
   *
   * - `pageQuery` may be:
   *   * a **sort descriptor** (`QuerySortDto`) ‒ an array of `[field, dir]`
   *   * a **paging object** (`PageQueryDto`) ‒ `{ limit, skip, sort }`
   * - Optional `projection` is forwarded to `findQuery`.
   * - Delegates execution to `this.execute`, mapping raw docs to `this.cls`.
   *
   * @param filter      Mongo filter selecting documents.
   * @param pageQuery   Sort descriptor **or** paging object.
   * @param projection  Optional Mongo projection.
   * @returns Promise resolving to the found documents.
   */
  async find(
    filter: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T> | PageQueryDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<T[]> {
    if (Array.isArray(pageQuery)) {
      const query = this.findQuery(filter, pageQuery, projection);
      return await this.execute(query, this.cls);
    }

    const query = this.findQuery(filter, pageQuery, projection);
    return await this.execute(query, this.cls);
  }

  /**
   * Ensure that population is possible for the current repository.
   *
   * Throws when either `populatePaths` or `clsPopulate` is not configured,
   * preventing accidental calls to population-aware methods.
   *
   * @throws Error if population cannot be performed.
   */
  private ensureCanPopulate(): void {
    if (!this.populatePaths || !this.clsPopulate) {
      throw new Error('Cannot populate query');
    }
  }

  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: PageQueryDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<TFull[]>;

  /**
   * @deprecated
   */
  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<TFull[]>;

  /**
   * Find documents that match `filters` and return them with the relations
   * in `populatePaths` resolved.
   *
   * - `pageQuery` can be either a sort descriptor (`QuerySortDto`) or a full
   *   paging object (`PageQueryDto`).
   * - Optional `projection` is forwarded to `findQuery`.
   * - Throws if the repository is not configured for population.
   *
   * @param filters     Mongo filter.
   * @param pageQuery   Sort or paging information.
   * @param projection  Optional Mongo projection.
   * @returns Promise resolving to the populated documents.
   */
  async findAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery?: QuerySortDto<T> | PageQueryDto<T>,
    projection?: TProjectionType<T>,
  ): Promise<TFull[]> {
    this.ensureCanPopulate();
    if (Array.isArray(pageQuery)) {
      const query = this.findQuery(filters, pageQuery, projection).populate(
        this.populatePaths,
      );
      return await this.execute(query, this.clsPopulate!);
    }

    const query = this.findQuery(filters, pageQuery, projection).populate(
      this.populatePaths,
    );
    return await this.execute(query, this.clsPopulate!);
  }

  /**
   * Build an un-executed query that selects **all** documents,
   * applies `sort`, and disables pagination (`limit` / `skip` = 0).
   *
   * @param sort  Optional sort descriptor.
   * @returns Mongoose `find` query.
   */
  protected findAllQuery(
    sort?: QuerySortDto<T>,
  ): Query<T[], T, object, T, 'find', object> {
    return this.findQuery({}, { limit: 0, skip: 0, sort });
  }

  /**
   * Retrieve every document in the collection, optionally sorted.
   *
   * @param sort  Optional sort descriptor.
   * @returns Promise resolving to the documents.
   */
  async findAll(sort?: QuerySortDto<T>): Promise<T[]> {
    return await this.find({}, { limit: 0, skip: 0, sort });
  }

  /**
   * Retrieve every document with all `populatePaths` relations resolved.
   *
   * - Throws if population is not configured.
   *
   * @param sort  Optional sort descriptor.
   * @returns Promise resolving to the populated documents.
   */
  async findAllAndPopulate(sort?: QuerySortDto<T>): Promise<TFull[]> {
    this.ensureCanPopulate();
    const query = this.findAllQuery(sort).populate(this.populatePaths);
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
      this.populatePaths,
    );
    return await this.execute(query, this.clsPopulate!);
  }

  /**
   * Return the total number of documents in the collection
   * (uses MongoDB’s `estimatedDocumentCount` for speed).
   *
   * @returns Promise resolving to the estimated document count.
   */
  async countAll(): Promise<number> {
    return await this.model.estimatedDocumentCount().exec();
  }

  /**
   * Count documents that match the given criteria
   * (falls back to all documents when `criteria` is omitted).
   *
   * @param criteria  Optional Mongo filter.
   * @returns Promise resolving to the exact document count.
   */
  async count(criteria?: TFilterQuery<T>): Promise<number> {
    return await this.model.countDocuments(criteria).exec();
  }

  /**
   * Persist a single document and return it as an instance of `this.cls`.
   *
   * Internally:
   * 1. `model.create()` inserts the raw DTO.
   * 2. The Mongoose document is converted to a plain object with `leanOpts`.
   * 3. `plainToClass()` transforms that object into the domain class.
   *
   * @param dto  Data-transfer object describing the new record.
   * @returns A hydrated instance of the domain class.
   */
  async create(dto: DtoInfer<DtoAction.Create, Dto, U>): Promise<T> {
    const doc = await this.model.create(dto);

    return plainToClass(
      this.cls,
      doc.toObject(this.leanOpts),
      this.transformOpts,
    );
  }

  /**
   * Persist an array of documents at once and map each result to `this.cls`.
   *
   * @param dtoArray  Array of DTOs to insert.
   * @returns Array of domain-class instances in the same order as `dtoArray`.
   */
  async createMany(
    dtoArray: DtoInfer<DtoAction.Create, Dto, U>[],
  ): Promise<T[]> {
    const docs = await this.model.create(dtoArray);

    return docs.map((doc) =>
      plainToClass(this.cls, doc.toObject(this.leanOpts), this.transformOpts),
    );
  }

  /**
   * Update a **single** document and return the modified version.
   *
   * Behaviour :
   * - `criteria` may be an `_id` string or any Mongo filter object.
   * - `dto` is applied via `$set`; when `options.shouldFlatten` is true the
   *   payload is flattened (e.g. `"a.b": value`) before the update.
   * - Fires the `pre|postUpdateValidate` hooks + events.
   * - Throws if nothing matches the criteria or if `dto` is empty.
   *
   * @param criteria `_id` or filter selecting the target document.
   * @param dto      Partial update payload.
   * @param options  `new`, `upsert`, `shouldFlatten`, … (forwarded to Mongoose).
   * @returns The updated document (with `new: true` by default).
   */
  async updateOne<D extends Partial<U>>(
    criteria: string | TFilterQuery<T>,
    dto: UpdateQuery<DtoInfer<DtoAction.Update, Dto, D>>,
    options?: TQueryOptions<D>,
  ): Promise<T> {
    const { shouldFlatten, ...rest } = {
      new: true,
      ...options,
    };
    const query = this.model.findOneAndUpdate<T>(
      {
        ...(typeof criteria === 'string' ? { _id: criteria } : criteria),
      },
      {
        $set: shouldFlatten ? flatten(dto) : dto,
      },
      rest,
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

  /**
   * Update **many** documents at once.
   *
   * - Applies `$set` with the supplied `dto`.
   * - When `options.shouldFlatten` is true, flattens the payload first.
   * - Does **not** run the validation / event hooks (use `updateOne` for that).
   *
   * @param filter  Mongo filter selecting the documents to update.
   * @param dto     Update payload.
   * @param options `{ shouldFlatten?: boolean }`.
   * @returns Promise that resolves a MongoDB `UpdateWriteOpResult` describing the operation outcome.
   */
  async updateMany<D extends Partial<U>>(
    filter: TFilterQuery<T>,
    dto: UpdateQuery<D>,
    options?: TFlattenOption,
  ): Promise<UpdateWriteOpResult> {
    return await this.model.updateMany<T>(filter, {
      $set: options?.shouldFlatten ? flatten(dto) : dto,
    });
  }

  /**
   * Remove **one** document, unless it is marked as `builtin: true`.
   *
   * If `criteria` is a string, it is treated as the document’s `_id`;
   * otherwise it is used as a full Mongo filter.
   * The filter is automatically augmented with `{ builtin: { $ne: true } }`
   * to protect built-in records from deletion.
   *
   * @param criteria  Document `_id` or Mongo filter.
   * @returns Promise that resolves to Mongo’s `DeleteResult`.
   */
  async deleteOne(criteria: string | TFilterQuery<T>): Promise<DeleteResult> {
    const filter = typeof criteria === 'string' ? { _id: criteria } : criteria;

    return await this.model
      .deleteOne({ ...filter, builtin: { $ne: true } })
      .exec();
  }

  /**
   * Remove **many** documents that match `criteria`, excluding those flagged
   * with `builtin: true`.
   *
   * @param criteria  Mongo filter describing the set to delete.
   * @returns Promise that resolves to Mongo’s `DeleteResult`.
   */
  async deleteMany(criteria: TFilterQuery<T>): Promise<DeleteResult> {
    return await this.model.deleteMany({ ...criteria, builtin: { $ne: true } });
  }

  /**
   * Runs *before* create-validation logic.
   * Override to perform domain-specific checks; throw to abort.
   *
   * @param _doc            The document that will be created.
   * @param _filterCriteria Optional additional criteria (e.g. conditional create).
   * @param _updates        Optional update pipeline when upserting.
   */
  async preCreateValidate(
    _doc: HydratedDocument<T>,
    _filterCriteria?: FilterQuery<T>,
    _updates?: UpdateWithAggregationPipeline | UpdateQuery<T>,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Called *after* create-validation passes,
   * but before persistence. Override for side-effects (audit logs, events, …).
   *
   * @param _validated  The validated (not yet saved) document.
   */
  async postCreateValidate(_validated: HydratedDocument<T>): Promise<void> {
    // Nothing ...
  }

  /**
   * Runs *before* validating a single-document update.
   * Override to enforce custom rules; throw to abort.
   *
   * @param _filterCriteria Query criteria used to locate the document.
   * @param _updates        Update payload or aggregation pipeline.
   */
  async preUpdateValidate(
    _filterCriteria: FilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<T>,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Called *after* an update payload is validated,
   * just before it is applied.
   *
   * @param _filterCriteria Same criteria passed to the update.
   * @param _updates        The validated update payload.
   */
  async postUpdateValidate(
    _filterCriteria: FilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<T>,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Rxecutes immediately before persisting a new document.
   * Use to inject defaults, timestamps, or derive fields.
   *
   * @param _doc  The document about to be saved.
   */
  async preCreate(_doc: HydratedDocument<T>): Promise<void> {
    // Nothing ...
  }

  /**
   * Fires right after a document is saved.
   * Useful for emitting events or refreshing caches.
   *
   * @param _created  The newly created document.
   */
  async postCreate(_created: HydratedDocument<T>): Promise<void> {
    // Nothing ...
  }

  /**
   * Runs before a `findOneAndUpdate` operation.
   *
   * @param _query     The Mongoose query object.
   * @param _criteria  Original filter criteria.
   * @param _updates   Update payload or pipeline.
   */
  async preUpdate(
    _query: Query<D, D, unknown, T, 'findOneAndUpdate'>,
    _criteria: TFilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<D>,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Runs before an `updateMany` operation.
   *
   * @param _query     The Mongoose query object.
   * @param _criteria  Filter criteria.
   * @param _updates   Update payload or pipeline.
   */
  async preUpdateMany(
    _query: Query<D, D, unknown, T, 'updateMany'>,
    _criteria: TFilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<D>,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Fires after an `updateMany` completes.
   *
   * @param _query    The originating query.
   * @param _updated  Mongoose result object.
   */
  async postUpdateMany(
    _query: Query<D, D, unknown, T, 'updateMany'>,
    _updated: any,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Fires after a `findOneAndUpdate` completes.
   *
   * @param _query    The originating query.
   * @param _updated  The updated document.
   */
  async postUpdate(
    _query: Query<D, D, unknown, T, 'findOneAndUpdate'>,
    _updated: T,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Runs before a `deleteOne` or `deleteMany`.
   *
   * @param _query     The Mongoose query object.
   * @param _criteria  Filter criteria.
   */
  async preDelete(
    _query: Query<DeleteResult, D, unknown, T, 'deleteOne' | 'deleteMany'>,
    _criteria: TFilterQuery<T>,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Fires after a `deleteOne` or `deleteMany` completes.
   *
   * @param _query   The originating query.
   * @param _result  MongoDB `DeleteResult`.
   */
  async postDelete(
    _query: Query<DeleteResult, D, unknown, T, 'deleteOne' | 'deleteMany'>,
    _result: DeleteResult,
  ): Promise<void> {
    // Nothing ...
  }

  /**
   * Translate a `PageQueryDto` into MongoDB aggregation stages.
   *
   * Creates, in order:
   * 1. **$sort** – when `page.sort` is provided. Accepts `1 | -1 | 'asc' | 'desc'`
   *    (plus `'ascending' | 'descending'`) and normalises them to `1` or `-1`.
   * 2. **$skip** – when `page.skip` > 0.
   * 3. **$limit** – when `page.limit` > 0.
   *
   * If `page` is omitted, an empty array is returned so callers can safely
   * spread the result into a pipeline without extra checks.
   *
   * @param page  Optional pagination/sort descriptor.
   * @returns Array of `$sort`, `$skip`, and `$limit` stages in the correct order.
   */
  buildPaginationPipelineStages<T>(page?: PageQueryDto<T>): PipelineStage[] {
    if (!page) return [];

    const stages: PipelineStage[] = [];

    if (page.sort) {
      const [field, dir] = page.sort;
      stages.push({
        $sort: {
          [field]:
            typeof dir === 'number'
              ? dir
              : ['asc', 'ascending'].includes(dir as string)
                ? 1
                : -1,
        } as Record<string, 1 | -1>,
      });
    }

    if (page.skip) stages.push({ $skip: page.skip });
    if (page.limit) stages.push({ $limit: page.limit });

    return stages;
  }

  /**
   * Populates the provided Mongoose documents with the relations listed in
   * `this.populatePaths`, returning lean (plain) objects.
   *
   * @param docs  Hydrated documents to enrich.
   * @returns Promise resolving to the populated docs.
   */
  async populate(docs: THydratedDocument<T>[]) {
    return await this.model.populate(
      docs,
      this.populatePaths.map((path) => ({
        path,
        options: { lean: true },
      })),
    );
  }
}
