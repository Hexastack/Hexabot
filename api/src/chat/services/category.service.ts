/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { CategoryDto } from '../dto/category.dto';
import { CategoryRepository } from '../repositories/category.repository';
import { Category } from '../schemas/category.schema';

@Injectable()
export class CategoryService extends BaseService<
  Category,
  never,
  never,
  CategoryDto
> {
  constructor(readonly repository: CategoryRepository) {
    super(repository);
  }
}
