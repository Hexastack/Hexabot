/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Document,
  Model,
  Query,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import { UserDto, UserEditProfileDto } from '../dto/user.dto';
import {
  User,
  USER_POPULATE,
  UserDocument,
  UserFull,
  UserPopulate,
} from '../schemas/user.schema';
import { hash } from '../utilities/bcryptjs';

@Injectable()
export class UserRepository extends BaseRepository<
  User,
  UserPopulate,
  UserFull,
  UserDto
> {
  constructor(@InjectModel(User.name) readonly model: Model<User>) {
    super(model, User, USER_POPULATE, UserFull);
  }

  /**
   * Pre-processing hook that hashes the password and resetToken before creating a user document.
   * Throws an error if no password is provided.
   *
   * @param _doc The user document being created.
   */
  async preCreate(_doc: UserDocument) {
    if (_doc?.password) {
      _doc.password = hash(_doc.password);
    } else {
      throw new Error('No password provided');
    }
    if (_doc?.resetToken) _doc.resetToken = hash(_doc.resetToken);
  }

  /**
   * Pre-processing hook that hashes the password and resetToken when updating a user document.
   *
   * @param _query The query object used for the update.
   * @param _criteria The criteria used to filter the user documents to update.
   * @param _updates The update object that may contain password or resetToken to be hashed.
   */
  async preUpdate(
    _query: Query<
      Document<User, any, any>,
      Document<User, any, any>,
      unknown,
      User,
      'findOneAndUpdate'
    >,
    _criteria: TFilterQuery<User>,
    _updates:
      | UpdateWithAggregationPipeline
      | UpdateQuery<Document<User, any, any>>,
  ) {
    const updates: UserEditProfileDto & {
      resetToken?: string;
    } = _updates?.['$set'];

    if (updates?.password) {
      _query.setUpdate({
        $set: {
          ...updates,
          password: hash(updates.password),
        },
      });
    }
    if (updates?.resetToken) {
      _query.setUpdate({
        $set: {
          ...updates,
          resetToken: hash(updates.resetToken),
        },
      });
    }
  }
}
