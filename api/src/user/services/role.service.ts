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
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { RoleRepository } from '../repositories/role.repository';
import { Role } from '../schemas/role.schema';

@Injectable()
export class RoleService extends BaseService<Role> {
  constructor(readonly repository: RoleRepository) {
    super(repository);
  }

  /**
   * Retrieves a paginated list of roles with related fields populated, based on the provided filters and pagination options.
   *
   * @param filters - Criteria used to filter the roles.
   * @param pageQuery - Pagination options, including page size and number.
   *
   * @returns A paginated result set of roles with related fields populated.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<Role>,
    pageQuery: PageQueryDto<Role>,
  ) {
    return await this.repository.findPageAndPopulate(filters, pageQuery);
  }

  /**
   * Retrieves a single role by its ID and populates its related fields.
   *
   * @param id - The unique identifier of the role to retrieve.
   *
   * @returns The role with related fields populated, or null if no role is found.
   */
  async findOneAndPopulate(id: string) {
    return await this.repository.findOneAndPopulate(id);
  }
}
