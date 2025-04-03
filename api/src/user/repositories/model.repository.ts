/*
 * Copyright © 2025 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model as MongooseModel } from 'mongoose';

import { BaseRepository, DeleteResult } from '@/utils/generics/base-repository';

import {
  Model,
  MODEL_POPULATE,
  ModelFull,
  ModelPopulate,
} from '../schemas/model.schema';
import { Permission } from '../schemas/permission.schema';

@Injectable()
export class ModelRepository extends BaseRepository<
  Model,
  ModelPopulate,
  ModelFull
> {
  constructor(
    @InjectModel(Model.name) readonly model: MongooseModel<Model>,
    @InjectModel(Permission.name)
    private readonly permissionModel: MongooseModel<Permission>,
  ) {
    super(model, Model, MODEL_POPULATE, ModelFull);
  }

  /**
   * Deletes a `Model` document by its ID and removes associated `Permission` documents.
   *
   * @param id - The ID of the `Model` document to delete.
   *
   * @returns The result of the delete operation.
   */
  async deleteOne(id: string): Promise<DeleteResult> {
    const result = await this.model.deleteOne({ _id: id }).exec();
    if (result.deletedCount > 0) {
      await this.permissionModel.deleteMany({ model: id });
    }
    return result;
  }
}
