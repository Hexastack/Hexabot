/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { ModelRepository } from '../repositories/model.repository';
import { Model, ModelFull, ModelPopulate } from '../schemas/model.schema';

@Injectable()
export class ModelService extends BaseService<Model, ModelPopulate, ModelFull> {
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
}
