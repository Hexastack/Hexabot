/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import {
  Args,
  preCreate,
  preUpdate,
} from '@/utils/types/lifecycle-hook-manager.types';

import { UserDto, UserEditProfileDto } from '../dto/user.dto';
import {
  User,
  USER_POPULATE,
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
  async preCreate(...[_doc]: Args<preCreate<User>>) {
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
  async preUpdate(...[_query, , _updates]: Args<preUpdate<User>>) {
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
