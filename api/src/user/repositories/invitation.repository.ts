/*
 * Copyright © 2024 Hexastack. All rights reserved.
 *
 * Licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:
 * 1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
 * 2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
 * 3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
 */

import { InjectModel } from '@nestjs/mongoose';
import { TFilterQuery, Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import { PageQueryDto } from '@/utils/pagination/pagination-query.dto';

import {
  Invitation,
  InvitationDocument,
  InvitationFull,
} from '../schemas/invitation.schema';
import { hash } from '../utilities/hash';

export class InvitationRepository extends BaseRepository<Invitation, 'roles'> {
  constructor(@InjectModel(Invitation.name) readonly model: Model<Invitation>) {
    super(model, Invitation);
  }

  /**
   * Pre-create hook that hashes the token of the invitation before saving it to the database.
   *
   * @param _doc - The document instance that is about to be created.
   */
  async preCreate(_doc: InvitationDocument) {
    if (_doc?.token) {
      _doc.token = hash(_doc.token);
    } else {
      throw new Error('No token provided');
    }
  }

  /**
   * Builds the query used to find invitations, applying the hashed token to the filter
   * if a token is provided.
   *
   * @param filter - The filter object for querying invitations.
   *
   * @returns The query with the hashed token if a token was provided, otherwise the original query.
   */
  protected findQuery(filter: TFilterQuery<Invitation>) {
    const filterWithHashedToken = filter.token
      ? { ...filter, token: hash(filter.token.toString()) }
      : filter;
    return super.findQuery(filterWithHashedToken);
  }

  /**
   * Finds a paginated list of invitations based on the filter and page query and populates the `roles` field.
   *
   * @param filter - The filter object for querying invitations.
   * @param pageQuery - The pagination query parameters.
   *
   * @returns A promise that resolves to a list of populated `InvitationFull` objects.
   */
  async findPageAndPopulate(
    filter: TFilterQuery<Invitation>,
    pageQuery: PageQueryDto<Invitation>,
  ): Promise<InvitationFull[]> {
    const query = this.findPageQuery(filter, pageQuery).populate('roles');
    return this.execute(query, InvitationFull);
  }

  /**
   * Finds a single invitation by its ID and populates the `roles` field.
   *
   * @param {string} id - The ID of the invitation to be retrieved.
   *
   * @returns {Promise<InvitationFull>} - A promise that resolves to the populated `InvitationFull` object.
   */
  async findOneAndPopulate(id: string): Promise<InvitationFull> {
    const query = this.findOneQuery(id).populate('roles');
    return this.executeOne(query, InvitationFull);
  }
}
