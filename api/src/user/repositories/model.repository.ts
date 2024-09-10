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
import { TFilterQuery, Model as MongooseModel } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';

import { ModelFull, Model } from '../schemas/model.schema';
import { Permission } from '../schemas/permission.schema';

@Injectable()
export class ModelRepository extends BaseRepository<Model, 'permissions'> {
  constructor(
    @InjectModel(Model.name) readonly model: MongooseModel<Model>,
    @InjectModel(Permission.name)
    private readonly permissionModel: MongooseModel<Permission>,
  ) {
    super(model, Model);
  }

  /**
   * Deletes a `Model` document by its ID and removes associated `Permission` documents.
   *
   * @param id - The ID of the `Model` document to delete.
   *
   * @returns The result of the delete operation.
   */
  async deleteOne(id: string) {
    const result = await this.model.deleteOne({ _id: id }).exec();
    if (result.deletedCount > 0) {
      await this.permissionModel.deleteMany({ model: id });
    }
    return result;
  }

  /**
   * Finds `Model` documents that match the provided filter and populates specified fields.
   *
   * @param filter - The filter query to apply.
   * @param populate - The fields to populate.
   *
   * @returns The populated `Model` documents.
   */
  async findAndPopulate(
    filter: TFilterQuery<Model>,
    populate: string[],
  ): Promise<ModelFull[]> {
    const query = this.findQuery(filter).populate(populate);
    return await this.execute(query, ModelFull);
  }

  /**
   * Finds a single `Model` document by its ID and populates its `permissions` field.
   *
   * @param id - The ID of the `Model` document to find.
   *
   * @returns The populated `Model` document.
   */
  async findOneAndPopulate(id: string) {
    const query = this.findOneQuery(id).populate('permissions');
    return await this.executeOne(query, ModelFull);
  }
}
