/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { BaseOrmService } from '@hexabot/core/database';
import { Injectable } from '@nestjs/common';

import { UserDtoConfig, UserTransformerDto } from '../dto/user.dto';
import { UserOrmEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserService extends BaseOrmService<
  UserOrmEntity,
  UserTransformerDto,
  UserDtoConfig
> {
  constructor(readonly repository: UserRepository) {
    super(repository);
  }
}
