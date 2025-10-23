/*
 * Hexabot — Fair Core License (FCL-1.0-ALv2)
 * Copyright (c) 2025 Hexastack.
 * Full terms: see LICENSE.md.
 */

import { Injectable } from '@nestjs/common';

import { BaseOrmSeeder } from '@/utils/generics/base-orm.seeder';

import { UserDtoConfig, UserTransformerDto } from '../dto/user.dto';
import { UserOrmEntity } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class UserSeeder extends BaseOrmSeeder<
  UserOrmEntity,
  UserTransformerDto,
  UserDtoConfig
> {
  constructor(private readonly userRepository: UserRepository) {
    super(userRepository);
  }
}
