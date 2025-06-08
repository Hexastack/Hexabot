/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import {
  Document,
  HydratedDocument,
  Query,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { DeleteResult } from '../generics/base-repository';

import { TFilterQuery } from './filter.types';

export type Args<T extends (...args: any) => unknown> = Parameters<T>;

export type R<T extends (...args: any) => unknown> = ReturnType<T>;

export type preCreateValidate<T> = (
  _doc: HydratedDocument<T>,
  _filterCriteria?: TFilterQuery<T>,
  _updates?: UpdateWithAggregationPipeline | UpdateQuery<T>,
) => Promise<void>;

export type postCreateValidate<T> = (
  _validated: HydratedDocument<T>,
) => Promise<void>;

export type preUpdateValidate<T> = (
  _filterCriteria: TFilterQuery<T>,
  _updates: UpdateWithAggregationPipeline | UpdateQuery<T>,
) => Promise<void>;

export type postUpdateValidate<T> = (
  _filterCriteria: TFilterQuery<T>,
  _updates: UpdateWithAggregationPipeline | UpdateQuery<T>,
) => Promise<void>;

export type preCreate<T> = (_doc: HydratedDocument<T>) => Promise<void>;

export type postCreate<T> = (_created: HydratedDocument<T>) => Promise<void>;

export type preUpdate<T> = (
  _query: Query<Document<T>, Document<T>, unknown, T, 'findOneAndUpdate'>,
  _criteria: TFilterQuery<T>,
  _updates: UpdateWithAggregationPipeline | UpdateQuery<Document<T>>,
) => Promise<void>;

export type preUpdateMany<T> = (
  _query: Query<Document<T>, Document<T>, unknown, T, 'updateMany'>,
  _criteria: TFilterQuery<T>,
  _updates: UpdateWithAggregationPipeline | UpdateQuery<Document<T>>,
) => Promise<void>;

export type postUpdateMany<T> = (
  _query: Query<Document<T>, Document<T>, unknown, T, 'updateMany'>,
  _updated: any,
) => Promise<void>;

export type postUpdate<T> = (
  _query: Query<Document<T>, Document<T>, unknown, T, 'findOneAndUpdate'>,
  _updated: T,
) => Promise<void>;

export type preDelete<T> = (
  _query: Query<
    DeleteResult,
    Document<T>,
    unknown,
    T,
    'deleteOne' | 'deleteMany'
  >,
  _criteria: TFilterQuery<T>,
) => Promise<void>;

export type postDelete<T> = (
  _query: Query<
    DeleteResult,
    Document<T>,
    unknown,
    T,
    'deleteOne' | 'deleteMany'
  >,
  _result: DeleteResult,
) => Promise<void>;
