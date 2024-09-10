/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';
import { TFilterQuery } from 'mongoose';

import { BaseService } from '@/utils/generics/base-service';

import { ModelRepository } from '../repositories/model.repository';
import { Model } from '../schemas/model.schema';

@Injectable()
export class ModelService extends BaseService<Model> {
  constructor(readonly repository: ModelRepository) {
    super(repository);
  }

  /**
   * Deletes a Model entity by its unique identifier.
   *
   * @param id - The unique identifier of the Model entity to delete.
   *
   * @returns A promise that resolves to the result of the deletion operation.
   */
  async deleteOne(id: string) {
    return await this.repository.deleteOne(id);
  }

  /**
   * Finds multiple Model entities based on provided filters and populates related entities.
   *
   * @param filters - The filters used to query the Model entities.
   * @param populate - Optional array of related entity fields to populate in the result.
   *
   * @returns A promise that resolves to the list of found Model entities with populated fields.
   */
  async findAndPopulate(filters: TFilterQuery<Model>, populate?: string[]) {
    return await this.repository.findAndPopulate(filters, populate);
  }

  /**
   * Finds a single Model entity by its unique identifier and populates related entities.
   *
   * @param id - The unique identifier of the Model entity to find.
   * @returns A promise that resolves to the found Model entity with populated fields.
   */
  async findOneAndPopulate(id: string) {
    return await this.repository.findOneAndPopulate(id);
  }
}
