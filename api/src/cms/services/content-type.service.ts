/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { ContentTypeDto } from '../dto/contentType.dto';
import { ContentTypeRepository } from '../repositories/content-type.repository';
import { ContentType } from '../schemas/content-type.schema';

@Injectable()
export class ContentTypeService extends BaseService<
  ContentType,
  never,
  never,
  ContentTypeDto
> {
  constructor(readonly repository: ContentTypeRepository) {
    super(repository);
  }

  /**
   * Deletes a specific content type by its ID, using cascade deletion.
   *
   * This method triggers the deletion of a single `ContentType` entity
   * from the repository. If there are any related content, they will be
   * deleted accordingly.
   *
   * @param id - The ID of the `ContentType` to be deleted.
   *
   * @returns A promise that resolves when the deletion is complete.
   */
  async deleteCascadeOne(id: string) {
    return await this.repository.deleteOne(id);
  }
}
