/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md and LICENSE-FCL.txt.
 */

import { Injectable } from '@nestjs/common';

import { BaseService } from '@/utils/generics/base-service';

import { UserDto } from '../dto/user.dto';
import { UserRepository } from '../repositories/user.repository';
import { User, UserFull, UserPopulate } from '../schemas/user.schema';

@Injectable()
export class UserService extends BaseService<
  User,
  UserPopulate,
  UserFull,
  UserDto
> {
  constructor(readonly repository: UserRepository) {
    super(repository);
  }
}
