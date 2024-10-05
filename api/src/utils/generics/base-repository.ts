/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClassTransformOptions, plainToClass } from 'class-transformer';
import {
  Document,
  FlattenMaps,
  HydratedDocument,
  Model,
  Query,
  SortOrder,
  TFilterQuery,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { BaseSchema } from './base-schema';
import { LifecycleHookManager } from './lifecycle-hook-manager';
import { PageQueryDto, QuerySortDto } from '../pagination/pagination-query.dto';

export type DeleteResult = {
  acknowledged: boolean;
  deletedCount: number;
};

export enum EHook {
  preCreate = 'preCreate',
  preUpdate = 'preUpdate',
  preDelete = 'preDelete',
  postCreate = 'postCreate',
  postUpdate = 'postUpdate',
  postDelete = 'postDelete',
}

export abstract class BaseRepository<
  T extends FlattenMaps<unknown>,
  P extends string = never,
  TFull extends Omit<T, P> = never,
  U = Omit<T, keyof BaseSchema>,
  D = Document<T>,
> {
  private readonly transformOpts = { excludePrefixes: ['_', 'password'] };

  private readonly leanOpts = { virtuals: true, defaults: true, getters: true };

  constructor(
    private readonly emitter: EventEmitter2,
    readonly model: Model<T>,
    private readonly cls: new () => T,
    protected readonly populate: P[] = [],
    protected readonly clsPopulate: new () => TFull = undefined,
  ) {
    this.registerLifeCycleHooks();
  }

  getPopulate() {
    return this.populate;
  }

  getEventName(suffix: EHook) {
    return `hook:${this.cls.name.toLocaleLowerCase()}:${suffix.toLocaleLowerCase()}`;
  }

  private registerLifeCycleHooks() {
    const repository = this;
    const hooks = LifecycleHookManager.getHooks(this.cls.name);

    hooks?.validate.pre.execute(async function () {
      const doc = this as HydratedDocument<T>;
      await repository.preValidate(doc);
    });

    hooks?.validate.post.execute(async function (created: HydratedDocument<T>) {
      await repository.postValidate(created);
    });

    hooks?.save.pre.execute(async function () {
      const doc = this as HydratedDocument<T>;
      await repository.preCreate(doc);
    });

    hooks?.save.post.execute(async function (created: HydratedDocument<T>) {
      repository.emitter.emit(
        repository.getEventName(EHook.postCreate),
        created,
      );
      await repository.postCreate(created);
    });

    hooks?.deleteOne.pre.execute(async function () {
      const query = this as Query<DeleteResult, D, unknown, T, 'deleteOne'>;
      const criteria = query.getQuery();
      await repository.preDelete(query, criteria);
    });

    hooks?.deleteOne.post.execute(async function (result: DeleteResult) {
      const query = this as Query<DeleteResult, D, unknown, T, 'deleteOne'>;
      await repository.postDelete(query, result);
    });

    hooks?.deleteMany.pre.execute(async function () {
      const query = this as Query<DeleteResult, D, unknown, T, 'deleteMany'>;
      const criteria = query.getQuery();
      await repository.preDelete(query, criteria);
    });

    hooks?.deleteMany.post.execute(async function (result: DeleteResult) {
      repository.emitter.emit(
        repository.getEventName(EHook.postDelete),
        result,
      );
      const query = this as Query<DeleteResult, D, unknown, T, 'deleteMany'>;
      await repository.postDelete(query, result);
    });

    hooks?.findOneAndUpdate.pre.execute(async function () {
      const query = this as Query<D, D, unknown, T, 'findOneAndUpdate'>;
      const criteria = query.getFilter();
      const updates = query.getUpdate();

      repository.emitter.emit(
        repository.getEventName(EHook.preUpdate),
        criteria,
        updates?.['$set'],
      );
      await repository.preUpdate(query, criteria, updates);
    });

    hooks?.findOneAndUpdate.post.execute(async function (
      updated: HydratedDocument<T>,
    ) {
      if (updated) {
        repository.emitter.emit(
          repository.getEventName(EHook.postUpdate),
          updated,
        );
        const query = this as Query<D, D, unknown, T, 'findOneAndUpdate'>;
        await repository.postUpdate(
          query,
          plainToClass(repository.cls, updated, repository.transformOpts),
        );
      }
    });
  }

  protected async execute<R extends Omit<T, P>>(
    query: Query<T[], T>,
    cls: new () => R,
  ) {
    const resultSet = await query.lean(this.leanOpts).exec();
    return resultSet.map((doc) => plainToClass(cls, doc, this.transformOpts));
  }

  protected async executeOne<R extends Omit<T, P>>(
    query: Query<T, T>,
    cls: new () => R,
    options?: ClassTransformOptions,
  ) {
    const doc = await query.lean(this.leanOpts).exec();
    return plainToClass(cls, doc, options ?? this.transformOpts);
  }

  protected findOneQuery(criteria: string | TFilterQuery<T>) {
    if (!criteria) {
      // An empty criteria would return the first document that it finds
      throw new Error('findOneQuery() should not have an empty criteria');
    }

    return typeof criteria === 'string'
      ? this.model.findById(criteria)
      : this.model.findOne<T>(criteria);
  }

  async findOne(
    criteria: string | TFilterQuery<T>,
    options?: ClassTransformOptions,
  ) {
    if (!criteria) {
      // @TODO : Issue a warning ?
      return Promise.resolve(undefined);
    }
    const query =
      typeof criteria === 'string'
        ? this.model.findById<T>(criteria)
        : this.model.findOne<T>(criteria);
    return await this.executeOne(query, this.cls, options);
  }

  async findOneAndPopulate(criteria: string | TFilterQuery<T>) {
    this.ensureCanPopulate();
    const query = this.findOneQuery(criteria).populate(this.populate);
    return await this.executeOne(query, this.clsPopulate);
  }

  protected findQuery(filter: TFilterQuery<T>, sort?: QuerySortDto<T>) {
    const query = this.model.find<T>(filter);
    if (sort) {
      return query.sort([sort] as [string, SortOrder][]);
    }
    return query;
  }

  async find(filter: TFilterQuery<T>, sort?: QuerySortDto<T>) {
    const query = this.findQuery(filter, sort);
    return await this.execute(query, this.cls);
  }

  private ensureCanPopulate() {
    if (!this.populate || !this.clsPopulate) {
      throw new Error('Cannot populate query');
    }
  }

  async findAndPopulate(filters: TFilterQuery<T>, sort?: QuerySortDto<T>) {
    this.ensureCanPopulate();
    const query = this.findQuery(filters, sort).populate(this.populate);
    return await this.execute(query, this.clsPopulate);
  }

  protected findAllQuery(sort?: QuerySortDto<T>) {
    return this.findQuery({}, sort);
  }

  async findAll(sort?: QuerySortDto<T>) {
    return await this.find({}, sort);
  }

  async findAllAndPopulate(sort?: QuerySortDto<T>) {
    this.ensureCanPopulate();
    const query = this.findAllQuery(sort).populate(this.populate);
    return await this.execute(query, this.clsPopulate);
  }

  protected findPageQuery(
    filters: TFilterQuery<T>,
    { skip, limit, sort }: PageQueryDto<T>,
  ) {
    return this.findQuery(filters)
      .skip(skip)
      .limit(limit)
      .sort([sort] as [string, SortOrder][]);
  }

  async findPage(
    filters: TFilterQuery<T>,
    pageQuery: PageQueryDto<T>,
  ): Promise<T[]> {
    const query = this.findPageQuery(filters, pageQuery);
    return await this.execute(query, this.cls);
  }

  async findPageAndPopulate(
    filters: TFilterQuery<T>,
    pageQuery: PageQueryDto<T>,
  ) {
    this.ensureCanPopulate();
    const query = this.findPageQuery(filters, pageQuery).populate(
      this.populate,
    );
    return await this.execute(query, this.clsPopulate);
  }

  async countAll(): Promise<number> {
    return await this.model.estimatedDocumentCount().exec();
  }

  async count(criteria?: TFilterQuery<T>): Promise<number> {
    return await this.model.countDocuments(criteria).exec();
  }

  async create(dto: U): Promise<T> {
    const doc = await this.model.create(dto);

    return plainToClass(
      this.cls,
      doc.toObject(this.leanOpts),
      this.transformOpts,
    );
  }

  async createMany(dtoArray: U[]) {
    const docs = await this.model.create(dtoArray);

    return docs.map((doc) =>
      plainToClass(this.cls, doc.toObject(this.leanOpts), this.transformOpts),
    );
  }

  async updateOne<D extends Partial<U>>(
    criteria: string | TFilterQuery<T>,
    dto: D,
  ): Promise<T> {
    const query = this.model.findOneAndUpdate<T>(
      {
        ...(typeof criteria === 'string' ? { _id: criteria } : criteria),
      },
      {
        $set: dto,
      },
      {
        new: true,
      },
    );
    return await this.executeOne(query, this.cls);
  }

  async updateMany<D extends Partial<U>>(filter: TFilterQuery<T>, dto: D) {
    return await this.model.updateMany<T>(filter, {
      $set: dto,
    });
  }

  async deleteOne(criteria: string | TFilterQuery<T>) {
    return await this.model
      .deleteOne(typeof criteria === 'string' ? { _id: criteria } : criteria)
      .exec();
  }

  async deleteMany(criteria: TFilterQuery<T>) {
    return await this.model.deleteMany(criteria);
  }

  async preValidate(_doc: HydratedDocument<T>) {
    // Nothing ...
  }

  async postValidate(_validated: HydratedDocument<T>) {
    // Nothing ...
  }

  async preCreate(_doc: HydratedDocument<T>) {
    // Nothing ...
  }

  async postCreate(_created: HydratedDocument<T>) {
    // Nothing ...
  }

  async preUpdate(
    _query: Query<D, D, unknown, T, 'findOneAndUpdate'>,
    _criteria: TFilterQuery<T>,
    _updates: UpdateWithAggregationPipeline | UpdateQuery<D>,
  ) {
    // Nothing ...
  }

  async postUpdate(
    _query: Query<D, D, unknown, T, 'findOneAndUpdate'>,
    _updated: T,
  ) {
    // Nothing ...
  }

  async preDelete(
    _query: Query<DeleteResult, D, unknown, T, 'deleteOne' | 'deleteMany'>,
    _criteria: TFilterQuery<T>,
  ) {
    // Nothing ...
  }

  async postDelete(
    _query: Query<DeleteResult, D, unknown, T, 'deleteOne' | 'deleteMany'>,
    _result: DeleteResult,
  ) {
    // Nothing ...
  }
}
