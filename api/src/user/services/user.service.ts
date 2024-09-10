/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { join } from 'path';

import { Injectable, NotFoundException, StreamableFile } from '@nestjs/common';
import { TFilterQuery } from 'mongoose';

import { AttachmentService } from '@/attachment/services/attachment.service';
import { getStreamableFile } from '@/attachment/utilities';
import { config } from '@/config';
import { BaseService } from '@/utils/generics/base-service';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import { RoleService } from './role.service';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../schemas/user.schema';

@Injectable()
export class UserService extends BaseService<User> {
  constructor(
    readonly repository: UserRepository,
    private readonly roleService: RoleService,
    private readonly attachmentService: AttachmentService,
  ) {
    super(repository);
  }

  /**
   * Finds a user by ID and populates the specified related fields.
   *
   * @param id - The ID of the user to find.
   * @param populate - (Optional) Array of related fields to populate in the result.
   *
   * @returns A promise that resolves with the populated user record.
   */
  async findOneAndPopulate(id: string, populate?: string[]) {
    return await this.repository.findOneAndPopulate(id, populate);
  }

  /**
   * Retrieves the user's profile picture as a streamable file.
   *
   * @param id - The ID of the user whose profile picture is requested.
   *
   * @returns A promise that resolves with the streamable file of the user's profile picture.
   */
  async userProfilePic(id: string): Promise<StreamableFile> {
    const user = await this.findOneAndPopulate(id, ['avatar']);
    if (user) {
      const attachment = user.avatar;
      const path = join(config.parameters.uploadDir, attachment.location);
      const disposition = `attachment; filename="${encodeURIComponent(
        attachment.name,
      )}"`;

      return getStreamableFile({
        path,
        options: {
          type: attachment.type,
          length: attachment.size,
          disposition,
        },
      });
    } else {
      throw new NotFoundException('Profile Not found');
    }
  }

  /**
   * Finds a paginated list of users based on filters and populates the specified related fields.
   *
   * @param filters - Filters to apply to the user search.
   * @param pageQuery - Pagination and sorting information for the query.
   * @param populate - (Optional) Array of related fields to populate in the result.
   *
   * @returns A promise that resolves with a paginated list of users.
   */
  async findPageAndPopulate(
    filters: TFilterQuery<User>,
    pageQuery: PageQueryDto<User>,
    populate?: string[],
  ) {
    return await this.repository.findPageAndPopulate(
      filters,
      pageQuery,
      populate,
    );
  }
}
