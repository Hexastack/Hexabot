/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';
import { TFilterQuery } from 'mongoose';

import { BaseService } from '@/utils/generics/base-service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { LabelRepository } from '../repositories/label.repository';
import { Label, LabelFull, LabelPopulate } from '../schemas/label.schema';

@Injectable()
export class LabelService extends BaseService<Label, LabelPopulate, LabelFull> {
  constructor(readonly repository: LabelRepository) {
    super(repository);
  }

  /**
   * Finds all labels and populates related data.
   *
   * @returns A promise that resolves with an array of labels with populated related data.
   */
  async findAllAndPopulate() {
    return await this.repository.findAllAndPopulate();
  }

  /**
   * Finds a page of labels based on filters and page query, and populates related data.
   *
   * @param filters The filters to apply when querying the labels.
   * @param pageQuery The pagination and sorting options.
   *
   * @returns A promise that resolves with a paginated list of labels with populated related data.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<Label>,
    pageQuery: PageQueryDto<Label>,
  ) {
    return await this.repository.findPageAndPopulate(filters, pageQuery);
  }

  /**
   * Finds a label by ID and populates related data.
   *
   * @param id The ID of the label to find.
   *
   * @returns A promise that resolves with the found label with populated related data or null if not found.
   */
  async findOneAndPopulate(id: string) {
    return await this.repository.findOneAndPopulate(id);
  }
}
