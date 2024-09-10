/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  TFilterQuery,
  Model,
  Query,
  UpdateQuery,
  UpdateWithAggregationPipeline,
  Document,
} from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { UserEditProfileDto } from '../dto/user.dto';
import { User, UserDocument, UserFull } from '../schemas/user.schema';
import { hash } from '../utilities/bcryptjs';

@Injectable()
export class UserRepository extends BaseRepository<User, 'roles' | 'avatar'> {
  constructor(@InjectModel(User.name) readonly model: Model<User>) {
    super(model, User);
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

  /**
   * Finds a page of user documents with population based on the given filter and page query.
   *
   * @param filter The filter criteria for finding users.
   * @param pageQuery The pagination and sorting information.
   * @param populate The fields to populate in the user documents.
   *
   * @returns A promise that resolves to an array of populated `UserFull` documents.
   */
  async findPageAndPopulate(
    filter: TFilterQuery<User>,
    pageQuery: PageQueryDto<User>,
    populate: string[],
  ): Promise<UserFull[]> {
    const query = this.findPageQuery(filter, pageQuery).populate(populate);
    return await this.execute(query, UserFull);
  }

  /**
   * Finds a single user document by ID with population of related fields.
   *
   * @param id The ID of the user to find.
   * @param populate The fields to populate in the user document.
   *
   * @returns A promise that resolves to a populated `UserFull` document.
   */
  async findOneAndPopulate(id: string, populate: string[]): Promise<UserFull> {
    const query = this.findOneQuery(id).populate(populate);
    return await this.executeOne(query, UserFull);
  }
}
