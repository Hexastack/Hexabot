/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@/utils/generics/base-repository';
import { TFilterQuery } from '@/utils/types/filter.types';

import {
  Invitation,
  INVITATION_POPULATE,
  InvitationDocument,
  InvitationFull,
  InvitationPopulate,
} from '../schemas/invitation.schema';
import { hash } from '../utilities/hash';

export class InvitationRepository extends BaseRepository<
  Invitation,
  InvitationPopulate,
  InvitationFull
> {
  constructor(@InjectModel(Invitation.name) readonly model: Model<Invitation>) {
    super(model, Invitation, INVITATION_POPULATE, InvitationFull);
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
}
