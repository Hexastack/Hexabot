/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmRepository } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  Invitation,
  InvitationDtoConfig,
  InvitationFull,
  InvitationTransformerDto,
} from '../dto/invitation.dto';
import { InvitationOrmEntity } from '../entities/invitation.entity';

@Injectable()
export class InvitationRepository extends BaseOrmRepository<
  InvitationOrmEntity,
  InvitationTransformerDto,
  InvitationDtoConfig
> {
  constructor(
    @InjectRepository(InvitationOrmEntity)
    repository: Repository<InvitationOrmEntity>,
  ) {
    super(repository, ['roles'], {
      PlainCls: Invitation,
      FullCls: InvitationFull,
    });
  }
}
