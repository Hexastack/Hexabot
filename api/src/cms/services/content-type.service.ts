/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
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
